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

public Beneficiary createBeneficiary(
        CreateBeneficiaryRequest request) {

    Customer customer = customerRepository
            .findById(request.getCustomerId())
            .orElseThrow(() ->
                    new CustomerNotFoundException(
                            "Customer not found with id: "
                                    + request.getCustomerId()));

    boolean exists =
            beneficiaryRepository
                    .existsByCustomerIdAndAccountNumber(
                            request.getCustomerId(),
                            request.getAccountNumber());

    if (exists) {

        throw new BusinessException(
                "Beneficiary account already exists");
    }

    Beneficiary beneficiary = new Beneficiary();

    beneficiary.setCustomer(customer);

    beneficiary.setName(
            request.getName());

    beneficiary.setAccountNumber(
            request.getAccountNumber());

    beneficiary.setBankName(
            request.getBankName());

    beneficiary.setIfscCode(
            request.getIfscCode());

    beneficiary.setStatus("ACTIVE");

    return beneficiaryRepository.save(beneficiary);
}

    public List<Beneficiary> getAllBeneficiaries() {

        return beneficiaryRepository.findAll();
    }

   // GET BENEFICIARY BY ID
    public Beneficiary getBeneficiaryById(Long id) {

        return beneficiaryRepository
                .findById(id)
                .orElseThrow(() ->
                        new BeneficiaryNotFoundException(
                                "Beneficiary not found with id: "
                                        + id));
    }


    // GET BENEFICIARIES BY CUSTOMER
    public List<Beneficiary> getBeneficiariesByCustomer(
            Long customerId) {

        if (!customerRepository.existsById(customerId)) {

            throw new CustomerNotFoundException(
                    "Customer not found with id: "
                            + customerId);
        }

        return beneficiaryRepository
                .findByCustomerId(customerId);
    }

public Beneficiary updateBeneficiary(
        Long id,
        UpdateBeneficiaryRequest request) {

    Beneficiary beneficiary =
            getBeneficiaryById(id);

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


    public Beneficiary deleteBeneficiary(Long id) {

        Beneficiary beneficiary =
                getBeneficiaryById(id);

        if ("INACTIVE".equals(beneficiary.getStatus())) {

    throw new BusinessException(
            "Beneficiary is already inactive");
}

        beneficiary.setStatus("INACTIVE");

        return beneficiaryRepository.save(beneficiary);
    }
}