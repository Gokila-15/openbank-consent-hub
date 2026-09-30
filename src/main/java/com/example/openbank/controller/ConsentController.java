package com.example.openbank.controller;

import com.example.openbank.dto.CreateConsentRequest;
import com.example.openbank.dto.UpdateConsentRequest;
import com.example.openbank.entity.Consent;
import com.example.openbank.service.ConsentService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<Consent> createConsent(
            @Valid @RequestBody CreateConsentRequest request) {

        Consent consent =
                consentService.createConsent(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(consent);
    }


    // GET ALL CONSENTS
    @GetMapping
    public ResponseEntity<List<Consent>> getAllConsents() {

        return ResponseEntity.ok(
                consentService.getAllConsents()
        );
    }


    // GET CONSENT BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Consent> getConsentById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                consentService.getConsentById(id)
        );
    }


    // GET CONSENTS BY CUSTOMER
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Consent>> getConsentsByCustomer(
            @PathVariable Long customerId) {

        return ResponseEntity.ok(
                consentService.getConsentsByCustomer(customerId)
        );
    }


    // APPROVE / REJECT CONSENT
    @PutMapping("/{id}")
    public ResponseEntity<Consent> updateConsent(
            @PathVariable Long id,
            @Valid @RequestBody UpdateConsentRequest request) {

        return ResponseEntity.ok(
                consentService.updateConsent(id, request)
        );
    }
}