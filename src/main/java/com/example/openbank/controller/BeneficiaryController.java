package com.example.openbank.controller;



import com.example.openbank.dto.CreateBeneficiaryRequest;
import com.example.openbank.dto.UpdateBeneficiaryRequest;
import com.example.openbank.entity.Beneficiary;
import com.example.openbank.service.BeneficiaryService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

@PostMapping
public ResponseEntity<Beneficiary> createBeneficiary(
        @Valid @RequestBody CreateBeneficiaryRequest request) {

    Beneficiary beneficiary =
            beneficiaryService.createBeneficiary(request);

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(beneficiary);
}

    @GetMapping
    public ResponseEntity<List<Beneficiary>>
    getAllBeneficiaries() {

        return ResponseEntity.ok(
                beneficiaryService.getAllBeneficiaries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Beneficiary>
    getBeneficiaryById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                beneficiaryService
                        .getBeneficiaryById(id));
    }

    @GetMapping("/customers/{customerId}")
    public ResponseEntity<List<Beneficiary>>
    getBeneficiariesByCustomer(
            @PathVariable Long customerId) {

        return ResponseEntity.ok(
                beneficiaryService
                        .getBeneficiariesByCustomer(
                                customerId));
    }

@PutMapping("/{id}")
public ResponseEntity<Beneficiary> updateBeneficiary(
        @PathVariable Long id,
        @Valid @RequestBody UpdateBeneficiaryRequest request) {

    return ResponseEntity.ok(
            beneficiaryService.updateBeneficiary(id, request)
    );
}


    @DeleteMapping("/{id}")
    public ResponseEntity<Beneficiary>
    deleteBeneficiary(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                beneficiaryService
                        .deleteBeneficiary(id));
    }
}
