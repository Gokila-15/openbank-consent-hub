package com.example.openbank.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class CreateAccountRequest {

    @NotBlank(message = "Account number is required")
    @Pattern(
            regexp = "^[0-9]{9,18}$",
            message = "Account number must contain 9 to 18 digits"
    )
    private String accountNumber;

    @NotBlank(message = "Account type is required")
    @Pattern(
            regexp = "^(SAVINGS|CURRENT)$",
            message = "Account type must be SAVINGS or CURRENT"
    )
    private String accountType;

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    public CreateAccountRequest() {
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }
}