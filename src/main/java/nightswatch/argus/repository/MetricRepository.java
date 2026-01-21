package nightswatch.argus.repository;

import nightswatch.argus.entity.Metric;
import nightswatch.argus.entity.Server;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MetricRepository extends JpaRepository<Metric, Long> {
    
    List<Metric> findByServerOrderByTimestampDesc(Server server);
    
    @Query("SELECT m FROM Metric m WHERE m.server = :server AND m.metricType = :type ORDER BY m.timestamp DESC")
    List<Metric> findByServerAndType(@Param("server") Server server, @Param("type") Metric.MetricType type);
    
    @Query("SELECT m FROM Metric m WHERE m.server = :server AND m.metricType = :type ORDER BY m.timestamp DESC")
    List<Metric> findLatestByServerAndTypeWithLimit(@Param("server") Server server, @Param("type") Metric.MetricType type, Pageable pageable);
    
    default Optional<Metric> findLatestByServerAndType(Server server, Metric.MetricType type) {
        List<Metric> results = findLatestByServerAndTypeWithLimit(server, type, Pageable.ofSize(1));
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }
    
    @Query("SELECT m FROM Metric m WHERE m.server = :server AND m.timestamp BETWEEN :start AND :end ORDER BY m.timestamp")
    List<Metric> findByServerAndTimeRange(
        @Param("server") Server server,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );
    
    @Query("SELECT m FROM Metric m WHERE m.server = :server AND m.metricType = :type AND m.timestamp BETWEEN :start AND :end ORDER BY m.timestamp")
    List<Metric> findByServerTypeAndTimeRange(
        @Param("server") Server server,
        @Param("type") Metric.MetricType type,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );
    
    @Query("SELECT AVG(m.value) FROM Metric m WHERE m.server = :server AND m.metricType = :type AND m.timestamp >= :since")
    Double getAverageValue(
        @Param("server") Server server,
        @Param("type") Metric.MetricType type,
        @Param("since") LocalDateTime since
    );
    
    @Modifying
    @Query("DELETE FROM Metric m WHERE m.timestamp < :threshold")
    int deleteOldMetrics(@Param("threshold") LocalDateTime threshold);
}
