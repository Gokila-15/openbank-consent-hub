package com.example.openbank.service;

import com.example.openbank.dto.CreateTransactionRequest;
import com.example.openbank.entity.Account;
import com.example.openbank.entity.Transaction;
import com.example.openbank.exception.BusinessException;
import com.example.openbank.repository.AccountRepository;
import com.example.openbank.repository.CustomerRepository;
import com.example.openbank.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private CustomerRepository customerRepository;

    private TransactionService transactionService;

    @BeforeEach
    void setUp() {
        transactionService = new TransactionService(transactionRepository, accountRepository, customerRepository);
    }

    // TEST 5: Transaction starts -> status = PENDING
    @Test
    void testTransactionStarts_StatusIsPending() {
        Account account = new Account();
        org.springframework.test.util.ReflectionTestUtils.setField(account, "id", 1L);
        account.setBalance(new BigDecimal("1000.00"));
        account.setStatus("ACTIVE");

        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateTransactionRequest request = new CreateTransactionRequest();
        request.setAccountId(1L);
        request.setType("DEPOSIT");
        request.setAmount(new BigDecimal("200.00"));
        request.setDescription("Test Deposit");

        Transaction transaction = transactionService.createTransaction(request);

        assertNotNull(transaction);
        assertEquals("PENDING", transaction.getStatus());
        assertNotNull(transaction.getCreatedAt());
        assertNotNull(transaction.getExpiresAt());
        assertTrue(transaction.getExpiresAt().isAfter(transaction.getCreatedAt()));
        assertEquals(transaction.getCreatedAt().plusSeconds(5), transaction.getExpiresAt());
    }

    // TEST 6: Transaction completes within 5 seconds -> status = COMPLETED
    @Test
    void testTransactionCompletesWithin5Seconds_StatusIsCompleted() {
        Transaction tx = new Transaction();
        tx.setStatus("PENDING");
        LocalDateTime now = LocalDateTime.now();
        tx.setCreatedAt(now);
        tx.setExpiresAt(now.plusSeconds(5));

        when(transactionRepository.findById(10L)).thenReturn(Optional.of(tx));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction completed = transactionService.completeTransaction(10L);

        assertEquals("COMPLETED", completed.getStatus());
        verify(transactionRepository).save(tx);
    }

    // TEST 7: Transaction remains pending for more than 5 seconds -> status = ROLLED_BACK
    @Test
    void testTransactionRollback_WhenScheduledCheckRuns() {
        Transaction expiredTx = new Transaction();
        expiredTx.setStatus("PENDING");
        LocalDateTime past = LocalDateTime.now().minusSeconds(6);
        expiredTx.setCreatedAt(past);
        expiredTx.setExpiresAt(past.plusSeconds(5));

        when(transactionRepository.findByStatusAndExpiresAtBefore(eq("PENDING"), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredTx));

        transactionService.checkAndRollbackExpiredTransactions();

        assertEquals("ROLLED_BACK", expiredTx.getStatus());
        verify(transactionRepository).save(expiredTx);
    }

    @Test
    void testCompleteTransaction_AfterExpiry_FailsAndRollsBack() {
        Transaction expiredTx = new Transaction();
        expiredTx.setStatus("PENDING");
        LocalDateTime past = LocalDateTime.now().minusSeconds(6);
        expiredTx.setCreatedAt(past);
        expiredTx.setExpiresAt(past.plusSeconds(5));

        when(transactionRepository.findById(20L)).thenReturn(Optional.of(expiredTx));

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            transactionService.completeTransaction(20L);
        });

        assertTrue(exception.getMessage().contains("expired"));
        assertEquals("ROLLED_BACK", expiredTx.getStatus());
        verify(transactionRepository).save(expiredTx);
    }
}
