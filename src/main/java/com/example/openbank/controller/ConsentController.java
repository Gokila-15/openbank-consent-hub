package com.example.openbank.controller;

import com.example.openbank.dto.CreateConsentRequest;
import com.example.openbank.dto.UpdateConsentRequest;
import com.example.openbank.entity.Consent;
import com.example.openbank.service.ConsentService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consents")
public class ConsentController {

    private final ConsentService consentService;

    public ConsentController(ConsentService consentService) {
        this.consentService = consentService;
    }

    // CREATE CONSENT
    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
    public ResponseEntity<Consent> createConsent(
            @Valid @RequestBody CreateConsentRequest request,
            Authentication authentication) {

        Consent consent =
                consentService.createConsent(
                        request,
                        authentication
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(consent);
    }

    // GET ALL CONSENTS
    @GetMapping
    @PreAuthorize("hasAnyRole('MAKER', 'CHECKER', 'ADMIN')")
    public ResponseEntity<List<Consent>> getAllConsents() {

        return ResponseEntity.ok(
                consentService.getAllConsents()
        );
    }

    // GET CONSENT BY ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'CHECKER', 'ADMIN')")
    public ResponseEntity<Consent> getConsentById(
            @PathVariable Long id,
            Authentication authentication) {

        return ResponseEntity.ok(
                consentService.getConsentById(
                        id,
                        authentication
                )
        );
    }

    // GET CONSENTS BY CUSTOMER
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
    public ResponseEntity<List<Consent>> getConsentsByCustomer(
            @PathVariable Long customerId,
            Authentication authentication) {

        return ResponseEntity.ok(
                consentService.getConsentsByCustomer(
                        customerId,
                        authentication
                )
        );
    }

    // APPROVE / REJECT CONSENT
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public ResponseEntity<Consent> updateConsent(
            @PathVariable Long id,
            @Valid @RequestBody UpdateConsentRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                consentService.updateConsent(
                        id,
                        request,
                        authentication
                )
        );
    }
}

