package com.example.openbank.exception;

public class ConsentNotFoundException extends RuntimeException {

    public ConsentNotFoundException(String message) {
        super(message);
    }
}