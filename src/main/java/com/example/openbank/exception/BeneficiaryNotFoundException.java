package com.example.openbank.exception;

public class BeneficiaryNotFoundException extends RuntimeException {

    public BeneficiaryNotFoundException(String message) {
        super(message);
    }
}