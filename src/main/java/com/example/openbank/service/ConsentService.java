package com.example.openbank.service;

import com.example.openbank.dto.CreateConsentRequest;
import com.example.openbank.dto.UpdateConsentRequest;
import com.example.openbank.entity.AuditTrail;
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
    private final AuditTrailService auditTrailService;

    public ConsentService(
            ConsentRepository consentRepository,
            CustomerRepository customerRepository,
            AuditTrailService auditTrailService) {

        this.consentRepository = consentRepository;
        this.customerRepository = customerRepository;
        this.auditTrailService = auditTrailService;
    }

    // CREATE CONSENT
    public Consent createConsent(
            CreateConsentRequest request,
            Authentication authentication) {

        String username = authentication.getName();

        Customer customer;

        // CUSTOMER creates consent
        if (isCustomer(authentication)) {

            customer = customerRepository
                    .findByUsernameIgnoreCase(username)
                    .or(() -> customerRepository.findByEmailIgnoreCase(username))
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

        Consent savedConsent = consentRepository.save(consent);

        // Audit Trail 1: Customer created consent
        auditTrailService.recordEvent(savedConsent.getId(), "CREATED", username);

        // Audit Trail 2: System automatically assigned to Maker review workflow
        auditTrailService.recordEvent(savedConsent.getId(), "SENT_TO_MAKER", "SYSTEM");

        return savedConsent;
    }

    // MAKER SUBMITS CONSENT TO CHECKER
    public Consent submitConsent(
            Long id,
            Authentication authentication) {

        Consent consent = getConsentByIdWithoutAuthentication(id);

        if (!"PENDING".equalsIgnoreCase(consent.getStatus())) {
            throw new BusinessException(
                    "Only PENDING consent can be submitted to Checker");
        }

        String username = authentication.getName();

        consent.setStatus("SUBMITTED");
        consent.setUpdatedAt(LocalDateTime.now());

        Consent savedConsent = consentRepository.save(consent);

        // Audit Trail 3: Maker submitted consent to Checker
        auditTrailService.recordEvent(savedConsent.getId(), "SUBMITTED_TO_CHECKER", username);

        return savedConsent;
    }

    // GET ALL CONSENTS
    public List<Consent> getAllConsents() {
        return consentRepository.findAll();
    }

    public List<Consent> getAllConsents(Authentication authentication) {
        if (authentication != null && isChecker(authentication) && !isAdmin(authentication)) {
            // Checker should see only Maker-submitted consents or reviewed consents, NOT unsubmitted PENDING consents
            return consentRepository.findByStatusIn(List.of("SUBMITTED", "APPROVED", "REJECTED"));
        }
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
         */
        if (isCustomer(authentication)) {

            String username = authentication.getName();

            Customer customer = customerRepository
                    .findByUsernameIgnoreCase(username)
                    .or(() -> customerRepository.findByEmailIgnoreCase(username))
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

        /*
         * CHECKER cannot see unsubmitted PENDING consents.
         */
        if (isChecker(authentication) && !isAdmin(authentication) && !isMaker(authentication)) {
            if ("PENDING".equalsIgnoreCase(consent.getStatus())) {
                throw new BusinessException(
                        "Checker can only access consents that have been submitted by Maker");
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
        if (isCustomer(authentication)) {

            /*
             * Get logged-in username from Keycloak.
             */
            String username = authentication.getName();

            /*
             * Find the logged-in customer.
             */
            Customer loggedInCustomer = customerRepository
                    .findByUsernameIgnoreCase(username)
                    .or(() -> customerRepository.findByEmailIgnoreCase(username))
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

        // For CHECKER, consent must be SUBMITTED
        if (isChecker(authentication) && !isAdmin(authentication)) {
            if (!"SUBMITTED".equalsIgnoreCase(consent.getStatus())) {
                throw new BusinessException(
                        "Consent must be submitted by Maker before Checker review");
            }
        } else {
            // Admin fallback
            if (!"SUBMITTED".equalsIgnoreCase(consent.getStatus()) && !"PENDING".equalsIgnoreCase(consent.getStatus())) {
                throw new BusinessException(
                        "Only SUBMITTED or PENDING consent can be approved or rejected");
            }
        }

        String username = authentication.getName();

        // Prevent creator from approving/rejecting own consent
        if (consent.getCreatedBy() != null && consent.getCreatedBy().equals(username)) {
            throw new BusinessException(
                    "You cannot approve or reject your own consent");
        }

        // Validate status
        if (!"APPROVED".equalsIgnoreCase(request.getStatus())
                && !"REJECTED".equalsIgnoreCase(request.getStatus())) {

            throw new BusinessException(
                    "Consent status must be APPROVED or REJECTED");
        }

        // APPROVE
        if ("APPROVED".equalsIgnoreCase(request.getStatus())) {

            consent.setStatus("APPROVED");
            consent.setApprovedBy(username);
            consent.setApprovedAt(LocalDateTime.now());

            Consent savedConsent = consentRepository.save(consent);

            // Audit Trail 4: Checker approved consent
            auditTrailService.recordEvent(savedConsent.getId(), "APPROVED", username);

            return savedConsent;
        }

        // REJECT
        else {

            consent.setStatus("REJECTED");
            consent.setRejectedBy(username);
            consent.setRejectedAt(LocalDateTime.now());

            Consent savedConsent = consentRepository.save(consent);

            // Audit Trail 5: Checker rejected consent
            auditTrailService.recordEvent(savedConsent.getId(), "REJECTED", username);

            return savedConsent;
        }
    }

    // GET AUDIT TRAIL FOR CONSENT
    public List<AuditTrail> getConsentAuditTrail(
            Long id,
            Authentication authentication) {

        // Validate access
        getConsentById(id, authentication);

        return auditTrailService.getAuditTrailByConsentId(id);
    }

    // INTERNAL METHOD
    // Used while processing consent
    private Consent getConsentByIdWithoutAuthentication(
            Long id) {

        return consentRepository.findById(id)
                .orElseThrow(() ->
                        new ConsentNotFoundException(
                                "Consent not found with id: " + id));
    }

    private boolean isCustomer(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_CUSTOMER"));
    }

    private boolean isChecker(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_CHECKER"));
    }

    private boolean isMaker(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_MAKER"));
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority()
                                .equals("ROLE_ADMIN"));
    }
}
