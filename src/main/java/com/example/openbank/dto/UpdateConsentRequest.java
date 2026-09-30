package com.example.openbank.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateConsentRequest {

    @NotBlank(message = "Status is required")
    @Pattern(
            regexp = "APPROVED|REJECTED",
            message = "Status must be APPROVED or REJECTED"
    )
    private String status;

    public UpdateConsentRequest() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
