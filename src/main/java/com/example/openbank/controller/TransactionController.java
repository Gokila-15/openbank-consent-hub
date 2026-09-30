package com.example.openbank.controller;

import com.example.openbank.dto.CreateTransactionRequest;
import com.example.openbank.entity.Transaction;
import com.example.openbank.service.TransactionService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

@PostMapping
public ResponseEntity<Transaction> createTransaction(
        @Valid @RequestBody CreateTransactionRequest request) {

    Transaction transaction =
            transactionService.createTransaction(request);

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(transaction);
}

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {

        return ResponseEntity.ok(
                transactionService.getAllTransactions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                transactionService.getTransactionById(id));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<Transaction>>
    getTransactionsByAccount(
            @PathVariable Long accountId) {

        return ResponseEntity.ok(
                transactionService
                        .getTransactionsByAccount(accountId));
    }
}