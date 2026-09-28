package com.example.openbank.service;

import com.example.openbank.dto.CreateAccountRequest;
import com.example.openbank.dto.UpdateAccountRequest;
import com.example.openbank.entity.Account;
import com.example.openbank.entity.Customer;
import com.example.openbank.repository.AccountRepository;
import com.example.openbank.repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;

    public AccountService(
            AccountRepository accountRepository,
            CustomerRepository customerRepository) {

        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
    }

    // CREATE
    public Account createAccount(CreateAccountRequest request) {

        // Check whether customer exists
        Customer customer = customerRepository
                .findById(request.getCustomerId())
                .orElseThrow(() ->
                        new RuntimeException("Customer not found"));

        // Check duplicate account number
        if (accountRepository.existsByAccountNumber(
                request.getAccountNumber())) {

            throw new RuntimeException(
                    "Account number already exists");
        }

        Account account = new Account();

        account.setAccountNumber(request.getAccountNumber());
        account.setAccountType(request.getAccountType());
        account.setCustomer(customer);

        // Initial balance is ZERO
        account.setBalance(java.math.BigDecimal.ZERO);

        // Initial status
        account.setStatus("ACTIVE");

        return accountRepository.save(account);
    }

    // GET ALL
    public List<Account> getAllAccounts() {

        return accountRepository.findAll();
    }

    // GET BY ID
    public Account getAccountById(Long id) {

        return accountRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Account not found"));
    }

    // GET BY CUSTOMER
    public List<Account> getAccountsByCustomer(Long customerId) {

        // Make sure customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new RuntimeException("Customer not found");
        }

        return accountRepository.findByCustomerId(customerId);
    }

    // PUT
    public Account updateAccount(
            Long id,
            UpdateAccountRequest request) {

        Account account = getAccountById(id);

        if (request.getAccountType() == null ||
                request.getStatus() == null) {

            throw new RuntimeException(
                    "PUT requires accountType and status");
        }

        account.setAccountType(request.getAccountType());
        account.setStatus(request.getStatus());

        return accountRepository.save(account);
    }

   

    // DELETE / CLOSE ACCOUNT
    public Account closeAccount(Long id) {

        Account account = getAccountById(id);

        if ("CLOSED".equals(account.getStatus())) {
            throw new RuntimeException(
                    "Account is already closed");
        }

        account.setStatus("CLOSED");

        return accountRepository.save(account);
    }
}