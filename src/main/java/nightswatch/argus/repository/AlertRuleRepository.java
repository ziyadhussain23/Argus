package nightswatch.argus.repository;

import nightswatch.argus.entity.AlertRule;
import nightswatch.argus.entity.Metric;
import nightswatch.argus.entity.Server;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRuleRepository extends JpaRepository<AlertRule, Long> {
    
    List<AlertRule> findByServer(Server server);
    
    List<AlertRule> findByServerAndIsEnabledTrue(Server server);
    
    @Query("SELECT ar FROM AlertRule ar WHERE ar.isEnabled = true")
    List<AlertRule> findAllEnabled();

    @Query("SELECT ar FROM AlertRule ar WHERE ar.server.owner.id = :ownerId AND ar.isEnabled = true")
    List<AlertRule> findEnabledByOwnerId(@Param("ownerId") Long ownerId);
    
    @Query("SELECT ar FROM AlertRule ar WHERE ar.server = :server AND ar.metricType = :type AND ar.isEnabled = true")
    List<AlertRule> findByServerAndMetricType(
        @Param("server") Server server,
        @Param("type") Metric.MetricType type
    );

    @Query("SELECT ar FROM AlertRule ar WHERE ar.server = :server AND ar.metricType IN :types AND ar.isEnabled = true")
    List<AlertRule> findEnabledByServerAndMetricTypes(
            @Param("server") Server server,
            @Param("types") List<Metric.MetricType> types
    );
}
