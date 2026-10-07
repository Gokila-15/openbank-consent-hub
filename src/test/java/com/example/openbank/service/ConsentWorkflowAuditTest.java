package com.example.openbank.service;

import com.example.openbank.dto.CreateConsentRequest;
import com.example.openbank.dto.UpdateConsentRequest;
import com.example.openbank.entity.AuditTrail;
import com.example.openbank.entity.Consent;
import com.example.openbank.entity.Customer;
import com.example.openbank.exception.BusinessException;
import com.example.openbank.repository.ConsentRepository;
import com.example.openbank.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ConsentWorkflowAuditTest {

    @Mock
    private ConsentRepository consentRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private AuditTrailService auditTrailService;

    @Mock
    private Authentication customerAuth;

    @Mock
    private Authentication makerAuth;

    @Mock
    private Authentication checkerAuth;

    private ConsentService consentService;

    @BeforeEach
    void setUp() {
        consentService = new ConsentService(consentRepository, customerRepository, auditTrailService);
    }

    private void setupAuth(Authentication auth, String username, String role) {
        lenient().when(auth.getName()).thenReturn(username);
        Collection<? extends GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));
        lenient().doReturn(authorities).when(auth).getAuthorities();
    }

    // TEST 1: Customer creates consent
    @Test
    void testCustomerCreatesConsent_AuditEventsAndMakerCheckerVisibility() {
        setupAuth(customerAuth, "customer1", "ROLE_CUSTOMER");
        setupAuth(checkerAuth, "checker1", "ROLE_CHECKER");

        Customer customer = new Customer();
        org.springframework.test.util.ReflectionTestUtils.setField(customer, "id", 1L);
        customer.setUsername("customer1");

        when(customerRepository.findByUsernameIgnoreCase("customer1")).thenReturn(Optional.of(customer));
        when(consentRepository.save(any(Consent.class))).thenAnswer(invocation -> {
            Consent c = invocation.getArgument(0);
            return c;
        });

        CreateConsentRequest request = new CreateConsentRequest();
        request.setCustomerId(1L);
        request.setPurpose("Data sharing for loan processing");
        request.setDataAccess("ACCOUNT_DETAILS");
        request.setExpiresAt(LocalDateTime.now().plusDays(30));

        Consent created = consentService.createConsent(request, customerAuth);

        assertNotNull(created);
        assertEquals("PENDING", created.getStatus());
        assertEquals("customer1", created.getCreatedBy());

        // Verify Audit Trail events: CREATED and SENT_TO_MAKER
        verify(auditTrailService).recordEvent(created.getId(), "CREATED", "customer1");
        verify(auditTrailService).recordEvent(created.getId(), "SENT_TO_MAKER", "SYSTEM");

        // Checker should not see unsubmitted PENDING consent when viewing by ID
        when(consentRepository.findById(100L)).thenReturn(Optional.of(created));
        assertThrows(BusinessException.class, () -> {
            consentService.getConsentById(100L, checkerAuth);
        });

        // Checker getAllConsents returns only Maker-submitted / processed consents
        when(consentRepository.findByStatusIn(List.of("SUBMITTED", "APPROVED", "REJECTED")))
                .thenReturn(List.of());
        List<Consent> checkerConsents = consentService.getAllConsents(checkerAuth);
        assertTrue(checkerConsents.isEmpty());
    }

    // TEST 2: Maker submits consent to Checker
    @Test
    void testMakerSubmitsConsent_MovesToSubmitted_AndRecordsAudit() {
        setupAuth(makerAuth, "maker1", "ROLE_MAKER");

        Consent pendingConsent = new Consent();
        pendingConsent.setStatus("PENDING");
        pendingConsent.setCreatedBy("customer1");

        when(consentRepository.findById(200L)).thenReturn(Optional.of(pendingConsent));
        when(consentRepository.save(any(Consent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Consent submitted = consentService.submitConsent(200L, makerAuth);

        assertEquals("SUBMITTED", submitted.getStatus());
        verify(auditTrailService).recordEvent(submitted.getId(), "SUBMITTED_TO_CHECKER", "maker1");
    }

    // TEST 3: Checker approves consent
    @Test
    void testCheckerApprovesConsent_RecordsAudit() {
        setupAuth(checkerAuth, "checker1", "ROLE_CHECKER");

        Consent submittedConsent = new Consent();
        submittedConsent.setStatus("SUBMITTED");
        submittedConsent.setCreatedBy("customer1");

        when(consentRepository.findById(300L)).thenReturn(Optional.of(submittedConsent));
        when(consentRepository.save(any(Consent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateConsentRequest request = new UpdateConsentRequest();
        request.setStatus("APPROVED");

        Consent approved = consentService.updateConsent(300L, request, checkerAuth);

        assertEquals("APPROVED", approved.getStatus());
        assertEquals("checker1", approved.getApprovedBy());
        assertNotNull(approved.getApprovedAt());
        verify(auditTrailService).recordEvent(approved.getId(), "APPROVED", "checker1");
    }

    // TEST 4: Checker rejects consent
    @Test
    void testCheckerRejectsConsent_RecordsAudit() {
        setupAuth(checkerAuth, "checker1", "ROLE_CHECKER");

        Consent submittedConsent = new Consent();
        submittedConsent.setStatus("SUBMITTED");
        submittedConsent.setCreatedBy("customer1");

        when(consentRepository.findById(400L)).thenReturn(Optional.of(submittedConsent));
        when(consentRepository.save(any(Consent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateConsentRequest request = new UpdateConsentRequest();
        request.setStatus("REJECTED");

        Consent rejected = consentService.updateConsent(400L, request, checkerAuth);

        assertEquals("REJECTED", rejected.getStatus());
        assertEquals("checker1", rejected.getRejectedBy());
        assertNotNull(rejected.getRejectedAt());
        verify(auditTrailService).recordEvent(rejected.getId(), "REJECTED", "checker1");
    }

    @Test
    void testGetConsentAuditTrail() {
        setupAuth(makerAuth, "maker1", "ROLE_MAKER");

        Consent consent = new Consent();
        consent.setStatus("APPROVED");

        when(consentRepository.findById(500L)).thenReturn(Optional.of(consent));
        when(auditTrailService.getAuditTrailByConsentId(500L)).thenReturn(List.of(
                new AuditTrail(500L, "CREATED", "customer1", LocalDateTime.now().minusHours(2)),
                new AuditTrail(500L, "SENT_TO_MAKER", "SYSTEM", LocalDateTime.now().minusHours(2)),
                new AuditTrail(500L, "SUBMITTED_TO_CHECKER", "maker1", LocalDateTime.now().minusHours(1)),
                new AuditTrail(500L, "APPROVED", "checker1", LocalDateTime.now())
        ));

        List<AuditTrail> history = consentService.getConsentAuditTrail(500L, makerAuth);

        assertEquals(4, history.size());
        assertEquals("CREATED", history.get(0).getAction());
        assertEquals("SENT_TO_MAKER", history.get(1).getAction());
        assertEquals("SUBMITTED_TO_CHECKER", history.get(2).getAction());
        assertEquals("APPROVED", history.get(3).getAction());
    }
}
