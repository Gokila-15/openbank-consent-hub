package com.example.openbank.service;

import com.example.openbank.dto.CreateCustomerRequest;
import com.example.openbank.dto.UpdateCustomerRequest;
import com.example.openbank.entity.Customer;
import com.example.openbank.exception.BusinessException;
import com.example.openbank.exception.CustomerNotFoundException;
import com.example.openbank.repository.CustomerRepository;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final KeycloakAdminService keycloakAdminService;

    public CustomerService(
            CustomerRepository customerRepository,
            KeycloakAdminService keycloakAdminService) {

        this.customerRepository = customerRepository;
        this.keycloakAdminService = keycloakAdminService;
    }

    // =========================================================
    // CREATE CUSTOMER
    // =========================================================

    public Customer createCustomer(CreateCustomerRequest request) {

        if (customerRepository.findByUsernameIgnoreCase(request.getUsername()).isPresent()) {
            throw new BusinessException("Customer with username '" + request.getUsername() + "' already exists");
        }

        if (customerRepository.findByEmailIgnoreCase(request.getEmail()).isPresent()) {
            throw new BusinessException("Customer with email '" + request.getEmail() + "' already exists");
        }

        // Create user in Keycloak
        // and assign CUSTOMER role
        keycloakAdminService.createCustomerUser(
                request.getUsername(),
                request.getEmail(),
                request.getName(),
                request.getLastName(),
                request.getPassword()
        );

        // Create customer in PostgreSQL
        Customer customer = new Customer();

        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());

        // Same username as Keycloak
        customer.setUsername(request.getUsername());
        customer.setPassword(request.getPassword());
        return customerRepository.save(customer);
    }

    // =========================================================
    // GET ALL CUSTOMERS
    // =========================================================

    public List<Customer> getAllCustomers() {

        return customerRepository.findAll();
    }

    // =========================================================
    // GET CUSTOMER BY USERNAME
    // =========================================================

    public Customer getCustomerByUsername(String username) {

        return customerRepository.findByUsernameIgnoreCase(username)
                .or(() -> customerRepository.findByEmailIgnoreCase(username))
                .orElseThrow(() ->
                        new CustomerNotFoundException(
                                "Customer not found for username: " + username
                        )
                );
    }

    // =========================================================
    // GET CUSTOMER BY ID
    // =========================================================

    public Customer getCustomerById(
            Long id,
            Authentication authentication) {

        Customer customer = customerRepository.findById(id)
                .orElseThrow(() ->
                        new CustomerNotFoundException(
                                "Customer not found with ID: " + id
                        )
                );

        boolean isCustomer = authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_CUSTOMER")
                );

        if (isCustomer) {

            String username = authentication.getName();

            if (!username.equals(customer.getUsername())) {

                throw new BusinessException(
                        "You are not allowed to access this customer"
                );
            }
        }

        return customer;
    }

    // =========================================================
    // UPDATE CUSTOMER
    // =========================================================

    public Customer updateCustomer(
            Long id,
            UpdateCustomerRequest request,
            Authentication authentication) {

        Customer customer = customerRepository.findById(id)
                .orElseThrow(() ->
                        new CustomerNotFoundException(
                                "Customer not found with id: " + id
                        )
                );

        boolean isCustomer = authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_CUSTOMER")
                );

        if (isCustomer) {

            String username = authentication.getName();

            if (!username.equals(customer.getUsername())) {

                throw new BusinessException(
                        "You are not allowed to update this customer"
                );
            }
        }

        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());

        return customerRepository.save(customer);
    }

    // =========================================================
    // DELETE CUSTOMER
    // =========================================================

    public void deleteCustomer(Long id) {

        Customer customer =
                getCustomerByIdWithoutAuthentication(id);

        customerRepository.delete(customer);
    }

    // =========================================================
    // INTERNAL METHOD
    // =========================================================

    private Customer getCustomerByIdWithoutAuthentication(
            Long id) {

        return customerRepository.findById(id)
                .orElseThrow(() ->
                        new CustomerNotFoundException(
                                "Customer not found with id: " + id
                        )
                );
    }
}