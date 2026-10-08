package com.example.openbank.service;

import com.example.openbank.dto.CreateAccountRequest;
import com.example.openbank.dto.UpdateAccountRequest;
import com.example.openbank.entity.Account;
import com.example.openbank.entity.Customer;
import com.example.openbank.repository.AccountRepository;
import com.example.openbank.repository.CustomerRepository;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.openbank.exception.AccountNotFoundException;
import com.example.openbank.exception.BusinessException;
import com.example.openbank.exception.CustomerNotFoundException;

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
                        new CustomerNotFoundException(
                                "Customer not found with id: "
                                        + request.getCustomerId()));

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
    public Account getAccountById(
            Long id,
            Authentication authentication) {

        Account account = accountRepository.findById(id)
                .orElseThrow(() ->
                        new AccountNotFoundException(
                                "Account not found with ID: " + id
                        )
                );

        /*
         * Check whether the logged-in user is CUSTOMER.
         */
        boolean isCustomer = authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_CUSTOMER"));

        /*
         * CUSTOMER can access only their own account.
         *
         * MAKER and ADMIN are allowed to access
         * according to their roles.
         */
        if (isCustomer) {

            // Get username from Keycloak JWT
            String username = authentication.getName();

            // Find logged-in customer
            Customer loggedInCustomer = customerRepository
                    .findByUsernameIgnoreCase(username)
                    .or(() -> customerRepository.findByEmailIgnoreCase(username))
                    .orElseThrow(() ->
                            new CustomerNotFoundException(
                                    "Customer not found for username: "
                                            + username));

            /*
             * Compare account owner's ID
             * with logged-in customer's ID.
             */
            if (!account.getCustomer().getId()
                    .equals(loggedInCustomer.getId())) {

                throw new BusinessException(
                        "You are not allowed to access this account");
            }
        }

        return account;
    }

    // GET BY CUSTOMER
    public List<Account> getAccountsByCustomer(
            Long customerId,
            Authentication authentication) {

        /*
         * Check whether logged-in user is CUSTOMER.
         */
        boolean isCustomer = authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_CUSTOMER"));

        /*
         * CUSTOMER can request only their own customer ID.
         */
        if (isCustomer) {

            String username = authentication.getName();

            // Find logged-in customer
            Customer loggedInCustomer = customerRepository
                    .findByUsernameIgnoreCase(username)
                    .or(() -> customerRepository.findByEmailIgnoreCase(username))
                    .orElseThrow(() ->
                            new CustomerNotFoundException(
                                    "Customer not found for username: "
                                            + username));

            /*
             * Compare URL customerId with
             * authenticated customer's ID.
             */
            if (!loggedInCustomer.getId()
                    .equals(customerId)) {

                throw new BusinessException(
                        "You are not allowed to access accounts "
                                + "of another customer");
            }
        }

        // Make sure customer exists
        if (!customerRepository.existsById(customerId)) {

            throw new CustomerNotFoundException(
                    "Customer not found with id: " + customerId
            );
        }

        return accountRepository.findByCustomerId(customerId);
    }

    // PUT
    public Account updateAccount(
            Long id,
            UpdateAccountRequest request) {

        Account account = getAccountByIdWithoutAuthentication(id);

        if (request.getAccountType() == null ||
                request.getStatus() == null) {

            throw new BusinessException(
                    "PUT requires accountType and status");
        }

        account.setAccountType(
                request.getAccountType());

        account.setStatus(
                request.getStatus());

        return accountRepository.save(account);
    }

    // DELETE / CLOSE ACCOUNT
    public Account closeAccount(Long id) {

        Account account =
                getAccountByIdWithoutAuthentication(id);

        if ("CLOSED".equalsIgnoreCase(account.getStatus())) {

            throw new BusinessException(
                    "Account is already closed");
        }
        if (account.getBalance() != null && account.getBalance().compareTo(java.math.BigDecimal.ZERO) != 0) {

            throw new BusinessException(
                    "Account can be closed only when the balance is zero.");
        }

        account.setStatus("CLOSED");

        return accountRepository.save(account);
    }

    // INTERNAL METHOD
    // Used by update and close operations
    private Account getAccountByIdWithoutAuthentication(
            Long id) {

        return accountRepository.findById(id)
                .orElseThrow(() ->
                        new AccountNotFoundException(
                                "Account not found with ID: " + id
                        )
                );
    }
}