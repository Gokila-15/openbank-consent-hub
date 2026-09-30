package com.example.openbank.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateAccountRequest {

    @NotBlank(message = "Account type is required")
    private String accountType;

    @NotBlank(message = "Status is required")
    private String status;

    public UpdateAccountRequest() {
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}