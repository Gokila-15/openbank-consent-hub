package com.example.openbank.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SecurityTestController {

    @GetMapping("/api/test/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public String customerTest() {
        return "CUSTOMER access granted";
    }
    @GetMapping("/api/test/maker")
    @PreAuthorize("hasRole('MAKER')")
    public String makerTest() {
        return "MAKER access granted";
}
}