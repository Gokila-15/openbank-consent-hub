package com.example.openbank.service;

import com.example.openbank.entity.AuditTrail;
import com.example.openbank.repository.AuditTrailRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditTrailService {

    private final AuditTrailRepository auditTrailRepository;

    public AuditTrailService(AuditTrailRepository auditTrailRepository) {
        this.auditTrailRepository = auditTrailRepository;
    }

    public AuditTrail recordEvent(Long consentId, String action, String performedBy) {
        AuditTrail auditTrail = new AuditTrail(
                consentId,
                action,
                performedBy,
                LocalDateTime.now()
        );
        return auditTrailRepository.save(auditTrail);
    }

    public List<AuditTrail> getAuditTrailByConsentId(Long consentId) {
        return auditTrailRepository.findByConsentIdOrderByPerformedAtAsc(consentId);
    }
}
