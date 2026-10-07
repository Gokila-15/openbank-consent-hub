package com.example.openbank.repository;

import com.example.openbank.entity.AuditTrail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditTrailRepository extends JpaRepository<AuditTrail, Long> {

    List<AuditTrail> findByConsentIdOrderByPerformedAtAsc(Long consentId);

    List<AuditTrail> findByConsentIdOrderByIdAsc(Long consentId);
}
