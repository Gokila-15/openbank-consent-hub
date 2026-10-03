package com.example.openbank.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/test/username")
    public String getUsername(Authentication authentication) {

        return authentication.getName();
    }
}