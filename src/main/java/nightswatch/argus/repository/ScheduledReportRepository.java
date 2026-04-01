package nightswatch.argus.repository;

import nightswatch.argus.entity.ScheduledReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScheduledReportRepository extends JpaRepository<ScheduledReport, Long> {

    List<ScheduledReport> findByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    @Query("SELECT r FROM ScheduledReport r WHERE r.frequency = 'AUTO' AND r.enabled = true AND r.nextRunAt IS NOT NULL AND r.nextRunAt <= :now")
    List<ScheduledReport> findDueAutoReports(@Param("now") LocalDateTime now);
}
