package com.example.openbank.repository;

import com.example.openbank.entity.Account;
import com.example.openbank.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByAccountNumber(String accountNumber);

    List<Account> findByCustomer(Customer customer);

    List<Account> findByCustomerId(Long customerId);

    boolean existsByAccountNumber(String accountNumber);
}