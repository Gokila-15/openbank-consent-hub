package com.example.openbank.service;

import com.example.openbank.dto.CreateConsentRequest;
import com.example.openbank.dto.UpdateConsentRequest;
import com.example.openbank.entity.Consent;
import com.example.openbank.entity.Customer;
import com.example.openbank.exception.BusinessException;
import com.example.openbank.exception.ConsentNotFoundException;
import com.example.openbank.exception.CustomerNotFoundException;
import com.example.openbank.repository.ConsentRepository;
import com.example.openbank.repository.CustomerRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConsentService {

    private final ConsentRepository consentRepository;
    private final CustomerRepository customerRepository;

    public ConsentService(
            ConsentRepository consentRepository,
            CustomerRepository customerRepository) {

        this.consentRepository = consentRepository;
        this.customerRepository = customerRepository;
    }

    // CREATE CONSENT
    public Consent createConsent(CreateConsentRequest request) {

        Customer customer = customerRepository
                .findById(request.getCustomerId())
                .orElseThrow(() ->
                        new CustomerNotFoundException(
                                "Customer not found with id: "
                                        + request.getCustomerId()));

        Consent consent = new Consent();

        consent.setCustomer(customer);
        consent.setPurpose(request.getPurpose());
        consent.setDataAccess(request.getDataAccess());
        consent.setExpiresAt(request.getExpiresAt());
        consent.setStatus("PENDING");

        return consentRepository.save(consent);
    }


    // GET ALL CONSENTS
    public List<Consent> getAllConsents() {

        return consentRepository.findAll();
    }


    // GET CONSENT BY ID
    public Consent getConsentById(Long id) {

        return consentRepository.findById(id)
                .orElseThrow(() ->
                        new ConsentNotFoundException(
                                "Consent not found with id: " + id));
    }


    // GET CONSENTS BY CUSTOMER
    public List<Consent> getConsentsByCustomer(Long customerId) {

        if (!customerRepository.existsById(customerId)) {
            throw new CustomerNotFoundException(
                    "Customer not found with id: " + customerId);
        }

        return consentRepository.findByCustomerId(customerId);
    }


    // APPROVE / REJECT CONSENT
    public Consent updateConsent(
            Long id,
            UpdateConsentRequest request) {

        Consent consent = getConsentById(id);

        if (!"PENDING".equals(consent.getStatus())) {

            throw new BusinessException(
                    "Only PENDING consent can be approved or rejected");
        }

        consent.setStatus(request.getStatus());

        return consentRepository.save(consent);
    }
}