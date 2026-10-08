package com.example.openbank.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateAccountRequest {

    @NotBlank(message = "Account type is required")
    @Pattern(
            regexp = "^(SAVINGS|CURRENT)$",
            message = "Account type must be SAVINGS or CURRENT"
    )
    private String accountType;

    @NotBlank(message = "Status is required")
    @Pattern(
            regexp = "^(ACTIVE|INACTIVE)$",
            message = "Status must be ACTIVE or INACTIVE"
    )
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