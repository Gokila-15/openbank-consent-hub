package com.example.openbank.repository;

import com.example.openbank.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByUsername(String username);
    Optional<Customer> findByUsernameIgnoreCase(String username);
    Optional<Customer> findByEmailIgnoreCase(String email);
}