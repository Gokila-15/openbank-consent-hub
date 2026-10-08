package com.example.openbank.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateCustomerRequest {

    @NotBlank(message = "Name is required")
    @Size(
            min = 2,
            max = 100,
            message = "Name must be between 2 and 100 characters"
    )
    private String name;

    @NotBlank(message = "Last name is required")
    @Size(
            min = 2,
            max = 100,
            message = "Last name must be between 2 and 100 characters"
    )
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^[0-9]{10}$",
            message = "Phone number must contain exactly 10 digits"
    )
    private String phone;

    @NotBlank(message = "Username is required")
    @Pattern(
            regexp = "^[a-zA-Z0-9._-]+$",
            message = "Username can contain letters, numbers, dot, underscore and hyphen only"
    )
    private String username;

    @NotBlank(message = "Password is required")
    @Size(
            min = 8,
            max = 20,
            message = "Password must contain between 8 and 20 characters"
    )
    private String password;

    public CreateCustomerRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}