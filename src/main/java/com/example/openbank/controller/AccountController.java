package com.example.openbank.controller;

import com.example.openbank.dto.CreateAccountRequest;
import com.example.openbank.dto.UpdateAccountRequest;
import com.example.openbank.entity.Account;
import com.example.openbank.service.AccountService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    // POST /api/accounts
    @PostMapping
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public ResponseEntity<Account> createAccount(
            @Valid @RequestBody CreateAccountRequest request) {

        Account account =
                accountService.createAccount(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(account);
    }

    // GET /api/accounts
    @GetMapping
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public ResponseEntity<List<Account>> getAllAccounts() {

        return ResponseEntity.ok(
                accountService.getAllAccounts()
        );
    }

    // GET /api/accounts/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
    public ResponseEntity<Account> getAccountById(
            @PathVariable Long id,
            Authentication authentication) {

        return ResponseEntity.ok(
                accountService.getAccountById(
                        id,
                        authentication
                )
        );
    }

    // GET /api/accounts/customer/{customerId}
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
    public ResponseEntity<List<Account>> getAccountsByCustomer(
            @PathVariable Long customerId,
            Authentication authentication) {

        return ResponseEntity.ok(
                accountService.getAccountsByCustomer(
                        customerId,
                        authentication
                )
        );
    }

    // PUT /api/accounts/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public ResponseEntity<Account> updateAccount(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAccountRequest request) {

        return ResponseEntity.ok(
                accountService.updateAccount(id, request)
        );
    }

    // DELETE /api/accounts/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public ResponseEntity<Account> deleteAccount(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                accountService.closeAccount(id)
        );
    }
}