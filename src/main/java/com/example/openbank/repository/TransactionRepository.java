package com.example.openbank.repository;

import com.example.openbank.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    List<Transaction> findByAccountId(Long accountId);

    List<Transaction> findByStatusAndExpiresAtBefore(String status, LocalDateTime time);

    List<Transaction> findByStatus(String status);
}