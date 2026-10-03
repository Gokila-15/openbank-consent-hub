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

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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
public Consent createConsent(
        CreateConsentRequest request,
        Authentication authentication) {

    String username = authentication.getName();

    Customer customer;

    // CUSTOMER creates consent
    if (authentication.getAuthorities()
            .stream()
            .anyMatch(authority ->
                    authority.getAuthority()
                            .equals("ROLE_CUSTOMER"))) {

        customer = customerRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new CustomerNotFoundException(
                                "Customer not found for username: "
                                        + username));
    }

    // MAKER / ADMIN creates consent
    else {

        customer = customerRepository
                .findById(request.getCustomerId())
                .orElseThrow(() ->
                        new CustomerNotFoundException(
                                "Customer not found with id: "
                                        + request.getCustomerId()));
    }

    Consent consent = new Consent();

    // Customer whose consent is being created
    consent.setCustomer(customer);

    // Actual user who created the consent
    consent.setCreatedBy(username);

    consent.setPurpose(request.getPurpose());
    consent.setDataAccess(request.getDataAccess());
    consent.setExpiresAt(request.getExpiresAt());

    // Every new consent starts as PENDING
    consent.setStatus("PENDING");

    return consentRepository.save(consent);
}
    // GET ALL CONSENTS
    public List<Consent> getAllConsents() {

        return consentRepository.findAll();
    }

    // GET CONSENT BY ID
    public Consent getConsentById(
            Long id,
            Authentication authentication) {

        Consent consent = consentRepository.findById(id)
                .orElseThrow(() ->
                        new ConsentNotFoundException(
                                "Consent not found with id: " + id));

        /*
         * CUSTOMER can access only their own consent.
         *
         * MAKER, CHECKER and ADMIN can access
         * according to their roles.
         */
        boolean isCustomer = authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_CUSTOMER"));

        if (isCustomer) {

            String username = authentication.getName();

            Customer customer = customerRepository
                    .findByUsername(username)
                    .orElseThrow(() ->
                            new CustomerNotFoundException(
                                    "Customer not found for username: "
                                            + username));

            if (!consent.getCustomer().getId()
                    .equals(customer.getId())) {

                throw new BusinessException(
                        "You are not allowed to access this consent");
            }
        }

        return consent;
    }

    // GET CONSENTS BY CUSTOMER
    public List<Consent> getConsentsByCustomer(
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

        if (isCustomer) {

            /*
             * Get logged-in username from Keycloak.
             */
            String username = authentication.getName();

            /*
             * Find the logged-in customer.
             */
            Customer loggedInCustomer = customerRepository
                    .findByUsername(username)
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
                        "You are not allowed to access consents "
                                + "of another customer");
            }
        }

        /*
         * Verify that the customer exists.
         */
        if (!customerRepository.existsById(customerId)) {

            throw new CustomerNotFoundException(
                    "Customer not found with id: " + customerId);
        }

        return consentRepository.findByCustomerId(customerId);
    }

    // APPROVE / REJECT CONSENT
   public Consent updateConsent(
        Long id,
        UpdateConsentRequest request,
        Authentication authentication) {

    Consent consent =
            getConsentByIdWithoutAuthentication(id);

    // Only PENDING consent can be processed
    if (!"PENDING".equals(consent.getStatus())) {
        throw new BusinessException(
                "Only PENDING consent can be approved or rejected");
    }

    String username = authentication.getName();

    // Prevent creator from approving/rejecting own consent
    if (consent.getCreatedBy().equals(username)) {
        throw new BusinessException(
                "You cannot approve or reject your own consent");
    }

    // Validate status
    if (!"APPROVED".equals(request.getStatus())
            && !"REJECTED".equals(request.getStatus())) {

        throw new BusinessException(
                "Consent status must be APPROVED or REJECTED");
    }

    // APPROVE
    if ("APPROVED".equals(request.getStatus())) {

        consent.setStatus("APPROVED");
        consent.setApprovedBy(username);
        consent.setApprovedAt(LocalDateTime.now());

    }

    // REJECT
    else {

        consent.setStatus("REJECTED");
        consent.setRejectedBy(username);
        consent.setRejectedAt(LocalDateTime.now());
    }

    return consentRepository.save(consent);
}
    // INTERNAL METHOD
    // Used by CHECKER / ADMIN while processing consent
    private Consent getConsentByIdWithoutAuthentication(
            Long id) {

        return consentRepository.findById(id)
                .orElseThrow(() ->
                        new ConsentNotFoundException(
                                "Consent not found with id: " + id));
    }
}

