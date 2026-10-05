package com.example.openbank.controller;

import com.example.openbank.dto.CreateCustomerRequest;
import com.example.openbank.dto.UpdateCustomerRequest;
import com.example.openbank.entity.Customer;
import com.example.openbank.service.CustomerService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    // CREATE CUSTOMER
    @PostMapping
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public ResponseEntity<Customer> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request) {

        Customer customer =
                customerService.createCustomer(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(customer);
    }

    // GET ALL CUSTOMERS
    @GetMapping
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public ResponseEntity<List<Customer>> getAllCustomers() {

        return ResponseEntity.ok(
                customerService.getAllCustomers()
        );
    }

    // GET CURRENT LOGGED-IN CUSTOMER
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
    public ResponseEntity<Customer> getCurrentCustomer(
            Authentication authentication) {

        return ResponseEntity.ok(
                customerService.getCustomerByUsername(
                        authentication.getName()
                )
        );
    }

    // GET CUSTOMER BY USERNAME
    @GetMapping("/username/{username}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
    public ResponseEntity<Customer> getCustomerByUsername(
            @PathVariable String username,
            Authentication authentication) {

        return ResponseEntity.ok(
                customerService.getCustomerByUsername(username)
        );
    }

    // GET CUSTOMER BY ID
@GetMapping("/{id}")
@PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
public ResponseEntity<Customer> getCustomer(
        @PathVariable Long id,
        Authentication authentication) {

    return ResponseEntity.ok(
            customerService.getCustomerById(
                    id,
                    authentication
            )
    );
}

    // UPDATE CUSTOMER
@PutMapping("/{id}")
@PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
public ResponseEntity<Customer> updateCustomer(
        @PathVariable Long id,
        @Valid @RequestBody UpdateCustomerRequest request,
        Authentication authentication) {

    Customer customer =
            customerService.updateCustomer(
                    id,
                    request,
                    authentication
            );

    return ResponseEntity.ok(customer);
}

    // DELETE CUSTOMER
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public ResponseEntity<Void> deleteCustomer(
            @PathVariable Long id) {

        customerService.deleteCustomer(id);

        return ResponseEntity.noContent().build();
    }
}