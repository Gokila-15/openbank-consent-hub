package com.example.openbank.exception;
import org.springframework.web.bind.MethodArgumentNotValidException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomerNotFoundException.class)
public ResponseEntity<Map<String, Object>> handleCustomerNotFound(
        CustomerNotFoundException ex) {

    return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(Map.of(
                    "status", 404,
                    "message", ex.getMessage(),
                    "timestamp", LocalDateTime.now()
            ));
}


@ExceptionHandler(AccountNotFoundException.class)
public ResponseEntity<Map<String, Object>> handleAccountNotFound(
        AccountNotFoundException ex) {

    return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(Map.of(
                    "status", 404,
                    "message", ex.getMessage(),
                    "timestamp", LocalDateTime.now()
            ));
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
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<Map<String, Object>> handleValidationException(
        MethodArgumentNotValidException ex) {

    Map<String, String> errors = new HashMap<>();

    ex.getBindingResult()
            .getFieldErrors()
            .forEach(error ->
                    errors.put(
                            error.getField(),
                            error.getDefaultMessage()
                    )
            );

    return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(Map.of(
                    "status", 400,
                    "message", "Validation failed",
                    "errors", errors,
                    "timestamp", LocalDateTime.now()
            ));
}
}