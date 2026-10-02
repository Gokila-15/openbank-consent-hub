package com.example.openbank.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/health")
    public String health() {
        return "OpenBank API is running";
    }
        @GetMapping("/api/test")
    public String test() {
        return "You are authenticated!";
    }
}