package com.example.openbank.controller;

import com.example.openbank.dto.CreateBeneficiaryRequest;
import com.example.openbank.dto.UpdateBeneficiaryRequest;
import com.example.openbank.entity.Beneficiary;
import com.example.openbank.service.BeneficiaryService;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    public BeneficiaryController(
            BeneficiaryService beneficiaryService) {

        this.beneficiaryService = beneficiaryService;
    }

    // POST /api/beneficiaries
  @PostMapping
@PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
public ResponseEntity<Beneficiary> createBeneficiary(
        @Valid @RequestBody CreateBeneficiaryRequest request,
        Authentication authentication) {

    Beneficiary beneficiary =
            beneficiaryService.createBeneficiary(
                    request,
                    authentication);

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(beneficiary);
}

    // GET /api/beneficiaries
    @GetMapping
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public ResponseEntity<List<Beneficiary>>
    getAllBeneficiaries() {

        return ResponseEntity.ok(
                beneficiaryService.getAllBeneficiaries()
        );
    }

    // GET /api/beneficiaries/{id}
   @GetMapping("/{id}")
@PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
public ResponseEntity<Beneficiary> getBeneficiaryById(
        @PathVariable Long id,
        Authentication authentication) {

    return ResponseEntity.ok(
            beneficiaryService.getBeneficiaryById(
                    id,
                    authentication)
    );
}

    // GET /api/beneficiaries/customers/{customerId}
   @GetMapping("/customers/{customerId}")
@PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
public ResponseEntity<List<Beneficiary>>
getBeneficiariesByCustomer(
        @PathVariable Long customerId,
        Authentication authentication) {

    return ResponseEntity.ok(
            beneficiaryService.getBeneficiariesByCustomer(
                    customerId,
                    authentication)
    );
}

    // PUT /api/beneficiaries/{id}
@PutMapping("/{id}")
@PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
public ResponseEntity<Beneficiary> updateBeneficiary(
        @PathVariable Long id,
        @Valid @RequestBody UpdateBeneficiaryRequest request,
        Authentication authentication) {

    return ResponseEntity.ok(
            beneficiaryService.updateBeneficiary(
                    id,
                    request,
                    authentication)
    );
}

    // DELETE /api/beneficiaries/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public ResponseEntity<Beneficiary>
    deleteBeneficiary(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                beneficiaryService.deleteBeneficiary(id)
        );
    }
}