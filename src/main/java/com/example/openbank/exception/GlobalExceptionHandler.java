package com.example.openbank.exception;

import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomerNotFoundException.class)
    public ResponseEntity<String> handleCustomerNotFound(
            CustomerNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ex.getMessage());
    }
    @ExceptionHandler(AccountNotFoundException.class)
public ResponseEntity<String> handleAccountNotFound(
        AccountNotFoundException ex) {

    return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ex.getMessage());
}
   @ExceptionHandler(BeneficiaryNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleBeneficiaryNotFound(
            BeneficiaryNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "status", 404,
                        "message", ex.getMessage(),
                        "timestamp", LocalDateTime.now()
                ));
    }
    @ExceptionHandler(TransactionNotFoundException.class)
public ResponseEntity<Map<String, Object>> handleTransactionNotFound(
        TransactionNotFoundException ex) {

    return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(Map.of(
                    "status", 404,
                    "message", ex.getMessage(),
                    "timestamp", LocalDateTime.now()
            ));
}
@ExceptionHandler(BusinessException.class)
public ResponseEntity<Map<String, Object>> handleBusinessException(
        BusinessException ex) {

    return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(Map.of(
                    "status", 400,
                    "message", ex.getMessage(),
                    "timestamp", LocalDateTime.now()
            ));
}
}