package com.example.openbank.service;

import com.example.openbank.dto.CreateTransactionRequest;
import com.example.openbank.entity.Account;
import com.example.openbank.entity.Customer;
import com.example.openbank.entity.Transaction;

import com.example.openbank.exception.TransactionNotFoundException;
import com.example.openbank.exception.AccountNotFoundException;
import com.example.openbank.exception.BusinessException;
import com.example.openbank.exception.CustomerNotFoundException;

import com.example.openbank.repository.AccountRepository;
import com.example.openbank.repository.CustomerRepository;
import com.example.openbank.repository.TransactionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;

    public TransactionService(
            TransactionRepository transactionRepository,
            AccountRepository accountRepository,
            CustomerRepository customerRepository) {

        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional
    public Transaction createTransaction(
            CreateTransactionRequest request) {

        Account account = accountRepository
                .findById(request.getAccountId())
                .orElseThrow(() ->
                        new AccountNotFoundException(
                                "Account not found with id: "
                                        + request.getAccountId()));

        if ("CLOSED".equals(account.getStatus())) {
            throw new BusinessException(
                    "Cannot perform transaction on closed account");
        }

        if (request.getAmount() == null ||
                request.getAmount()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new BusinessException(
                    "Amount must be greater than zero");
        }

        BigDecimal currentBalance = account.getBalance();
        BigDecimal newBalance;

        if ("DEPOSIT".equalsIgnoreCase(request.getType())) {

            newBalance =
                    currentBalance.add(request.getAmount());

        } else if ("WITHDRAWAL".equalsIgnoreCase(request.getType())) {

            if (currentBalance.compareTo(
                    request.getAmount()) < 0) {

                throw new BusinessException(
                        "Insufficient balance");
            }

            newBalance =
                    currentBalance.subtract(
                            request.getAmount());

        } else {

            throw new BusinessException(
                    "Transaction type must be DEPOSIT or WITHDRAWAL");
        }

        account.setBalance(newBalance);
        accountRepository.save(account);

        Transaction transaction = new Transaction();

        transaction.setAccount(account);
        transaction.setType(
                request.getType().toUpperCase());
        transaction.setAmount(
                request.getAmount());
        transaction.setBalanceAfter(
                newBalance);
        transaction.setDescription(
                request.getDescription());

        return transactionRepository.save(transaction);
    }

    public List<Transaction> getAllTransactions() {

        return transactionRepository.findAll();
    }

    public Transaction getTransactionById(
            Long id,
            Authentication authentication) {

        Transaction transaction =
                transactionRepository.findById(id)
                        .orElseThrow(() ->
                                new TransactionNotFoundException(
                                        "Transaction not found with id: "
                                                + id));

        if (isCustomer(authentication)) {

            Customer loggedInCustomer =
                    getLoggedInCustomer(authentication);

            Long transactionCustomerId =
                    transaction.getAccount()
                            .getCustomer()
                            .getId();

            if (!transactionCustomerId.equals(
                    loggedInCustomer.getId())) {

                throw new BusinessException(
                        "You are not allowed to access this transaction");
            }
        }

        return transaction;
    }

    public List<Transaction> getTransactionsByAccount(
            Long accountId,
            Authentication authentication) {

        Account account = accountRepository
                .findById(accountId)
                .orElseThrow(() ->
                        new AccountNotFoundException(
                                "Account not found with id: "
                                        + accountId));

        if (isCustomer(authentication)) {

            Customer loggedInCustomer =
                    getLoggedInCustomer(authentication);

            Long accountCustomerId =
                    account.getCustomer().getId();

            if (!accountCustomerId.equals(
                    loggedInCustomer.getId())) {

                throw new BusinessException(
                        "You are not allowed to access transactions "
                                + "of another customer's account");
            }
        }

        return transactionRepository
                .findByAccountId(accountId);
    }

    private boolean isCustomer(
            Authentication authentication) {

        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_CUSTOMER"));
    }

    private Customer getLoggedInCustomer(
            Authentication authentication) {

        String username = authentication.getName();

        return customerRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new CustomerNotFoundException(
                                "Customer not found for username: "
                                        + username));
    }
}