package com.example.openbank.controller;

import com.example.openbank.dto.CreateAccountRequest;
import com.example.openbank.dto.UpdateAccountRequest;
import com.example.openbank.entity.Account;
import com.example.openbank.service.AccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<Account> createAccount(
            @RequestBody CreateAccountRequest request) {

        Account account =
                accountService.createAccount(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(account);
    }

    // GET /api/accounts
    @GetMapping
    public ResponseEntity<List<Account>> getAllAccounts() {

        return ResponseEntity.ok(
                accountService.getAllAccounts()
        );
    }

    // GET /api/accounts/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Account> getAccountById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                accountService.getAccountById(id)
        );
    }

    // GET /api/accounts/customer/{customerId}
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Account>> getAccountsByCustomer(
            @PathVariable Long customerId) {

        return ResponseEntity.ok(
                accountService.getAccountsByCustomer(customerId)
        );
    }

    // PUT /api/accounts/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Account> updateAccount(
            @PathVariable Long id,
            @RequestBody UpdateAccountRequest request) {

        return ResponseEntity.ok(
                accountService.updateAccount(id, request)
        );
    }

    // PATCH /api/accounts/{id}

    // DELETE /api/accounts/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Account> deleteAccount(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                accountService.closeAccount(id)
        );
    }
}