package com.example.openbank.controller;

import com.example.openbank.dto.CreateTransactionRequest;
import com.example.openbank.entity.Transaction;
import com.example.openbank.service.TransactionService;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(
            TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // POST /api/transactions
    @PostMapping
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public ResponseEntity<Transaction> createTransaction(
            @Valid @RequestBody CreateTransactionRequest request) {

        Transaction transaction =
                transactionService.createTransaction(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(transaction);
    }

    // GET /api/transactions
    @GetMapping
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public ResponseEntity<List<Transaction>> getAllTransactions() {

        return ResponseEntity.ok(
                transactionService.getAllTransactions()
        );
    }

    // GET /api/transactions/{id}
 @GetMapping("/{id}")
@PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
public ResponseEntity<Transaction> getTransactionById(
        @PathVariable Long id,
        Authentication authentication) {

    return ResponseEntity.ok(
            transactionService.getTransactionById(
                    id,
                    authentication
            )
    );
}

    // GET /api/transactions/account/{accountId}
 @GetMapping("/account/{accountId}")
@PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
public ResponseEntity<List<Transaction>> getTransactionsByAccount(
        @PathVariable Long accountId,
        Authentication authentication) {

    return ResponseEntity.ok(
            transactionService.getTransactionsByAccount(
                    accountId,
                    authentication
            )
    );
}
}