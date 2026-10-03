package com.example.openbank.service;

import com.example.openbank.dto.CreateBeneficiaryRequest;
import com.example.openbank.dto.UpdateBeneficiaryRequest;
import com.example.openbank.entity.Beneficiary;
import com.example.openbank.entity.Customer;

import com.example.openbank.exception.BeneficiaryNotFoundException;
import com.example.openbank.exception.BusinessException;
import com.example.openbank.exception.CustomerNotFoundException;

import com.example.openbank.repository.BeneficiaryRepository;
import com.example.openbank.repository.CustomerRepository;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BeneficiaryService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final CustomerRepository customerRepository;

    public BeneficiaryService(
            BeneficiaryRepository beneficiaryRepository,
            CustomerRepository customerRepository) {

        this.beneficiaryRepository = beneficiaryRepository;
        this.customerRepository = customerRepository;
    }

    // CREATE BENEFICIARY
    public Beneficiary createBeneficiary(
            CreateBeneficiaryRequest request,
            Authentication authentication) {

        Customer customer;

        if (isCustomer(authentication)) {

            customer = getLoggedInCustomer(authentication);

        } else {

            customer = customerRepository
                    .findById(request.getCustomerId())
                    .orElseThrow(() ->
                            new CustomerNotFoundException(
                                    "Customer not found with id: "
                                            + request.getCustomerId()));
        }

        boolean exists =
                beneficiaryRepository
                        .existsByCustomerIdAndAccountNumber(
                                customer.getId(),
                                request.getAccountNumber());

        if (exists) {
            throw new BusinessException(
                    "Beneficiary account already exists");
        }

        Beneficiary beneficiary = new Beneficiary();

        beneficiary.setCustomer(customer);
        beneficiary.setName(request.getName());
        beneficiary.setAccountNumber(
                request.getAccountNumber());
        beneficiary.setBankName(
                request.getBankName());
        beneficiary.setIfscCode(
                request.getIfscCode());
        beneficiary.setStatus("ACTIVE");

        return beneficiaryRepository.save(beneficiary);
    }

    // GET ALL BENEFICIARIES
    public List<Beneficiary> getAllBeneficiaries() {

        return beneficiaryRepository.findAll();
    }

    // GET BENEFICIARY BY ID
    public Beneficiary getBeneficiaryById(
            Long id,
            Authentication authentication) {

        Beneficiary beneficiary =
                beneficiaryRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new BeneficiaryNotFoundException(
                                        "Beneficiary not found with id: "
                                                + id));

        if (isCustomer(authentication)) {

            Customer loggedInCustomer =
                    getLoggedInCustomer(authentication);

            if (!beneficiary.getCustomer().getId()
                    .equals(loggedInCustomer.getId())) {

                throw new BusinessException(
                        "You are not allowed to access "
                                + "this beneficiary");
            }
        }

        return beneficiary;
    }

    // GET BENEFICIARIES BY CUSTOMER
    public List<Beneficiary> getBeneficiariesByCustomer(
            Long customerId,
            Authentication authentication) {

        if (isCustomer(authentication)) {

            Customer loggedInCustomer =
                    getLoggedInCustomer(authentication);

            if (!loggedInCustomer.getId()
                    .equals(customerId)) {

                throw new BusinessException(
                        "You are not allowed to access "
                                + "beneficiaries of another customer");
            }
        }

        if (!customerRepository.existsById(customerId)) {

            throw new CustomerNotFoundException(
                    "Customer not found with id: "
                            + customerId);
        }

        return beneficiaryRepository
                .findByCustomerId(customerId);
    }

    // UPDATE BENEFICIARY
    public Beneficiary updateBeneficiary(
            Long id,
            UpdateBeneficiaryRequest request,
            Authentication authentication) {

        Beneficiary beneficiary =
                getBeneficiaryById(
                        id,
                        authentication);

        if (request.getName() == null ||
                request.getAccountNumber() == null ||
                request.getBankName() == null ||
                request.getIfscCode() == null ||
                request.getStatus() == null) {

            throw new BusinessException(
                    "PUT requires all beneficiary fields");
        }

        beneficiary.setName(
                request.getName());

        beneficiary.setAccountNumber(
                request.getAccountNumber());

        beneficiary.setBankName(
                request.getBankName());

        beneficiary.setIfscCode(
                request.getIfscCode());

        beneficiary.setStatus(
                request.getStatus());

        return beneficiaryRepository.save(beneficiary);
    }

    // DELETE BENEFICIARY
    public Beneficiary deleteBeneficiary(
            Long id) {

        Beneficiary beneficiary =
                getBeneficiaryByIdWithoutAuthentication(id);

        if ("INACTIVE".equals(
                beneficiary.getStatus())) {

            throw new BusinessException(
                    "Beneficiary is already inactive");
        }

        beneficiary.setStatus("INACTIVE");

        return beneficiaryRepository.save(beneficiary);
    }

    // CHECK CUSTOMER ROLE
    private boolean isCustomer(
            Authentication authentication) {

        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_CUSTOMER"));
    }

    // GET LOGGED-IN CUSTOMER
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

    // FIND BENEFICIARY WITHOUT OWNERSHIP CHECK
    private Beneficiary getBeneficiaryByIdWithoutAuthentication(
            Long id) {

        return beneficiaryRepository
                .findById(id)
                .orElseThrow(() ->
                        new BeneficiaryNotFoundException(
                                "Beneficiary not found with id: "
                                        + id));
    }
}