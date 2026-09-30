# OpenBank Consent Hub

A secure Open Banking Consent Management System built using Spring Boot, PostgreSQL, JPA/Hibernate, Bean Validation, and REST APIs.

The project is being developed as part of a Full-Stack Developer Training and Selection Program.

---

## Project Overview

OpenBank Consent Hub is a backend-focused Open Banking application that manages customers, bank accounts, transactions, beneficiaries, and customer consent requests.

The system is designed around a banking domain and will later be extended with:

* Keycloak authentication
* JWT-based API security
* Role-Based Access Control (RBAC)
* Maker/Checker workflow
* React frontend
* Nginx API gateway
* Docker Compose

### Current Status

The following backend modules have been completed:

* Customer Management
* Account Management
* Transaction Management
* Beneficiary Management
* Consent Management
* Bean Validation
* Custom Exception Handling
* Global Exception Handling

---

# Technology Stack

| Technology              | Purpose                        |
| ----------------------- | ------------------------------ |
| Java 21                 | Backend programming language   |
| Spring Boot             | Backend framework              |
| Spring Web              | REST API development           |
| Spring Data JPA         | Database access                |
| Hibernate               | ORM                            |
| PostgreSQL              | Relational database            |
| Jakarta Bean Validation | Request validation             |
| Spring Security         | Initial security configuration |
| Maven                   | Dependency management          |
| Postman                 | API testing                    |
| Git/GitHub              | Version control                |

---

# Project Architecture

```text
                    Client
                      |
                      | HTTP Request
                      ↓
                REST Controller
                      |
                      ↓
                     DTO
                      |
                 @Valid
                      |
                      ↓
                  Service
                      |
                      ↓
                 Repository
                      |
                      ↓
                 JPA/Hibernate
                      |
                      ↓
                  PostgreSQL
```

Exception handling:

```text
Controller
    |
    | Exception
    ↓
GlobalExceptionHandler
    |
    ↓
HTTP Error Response
```

---

# Project Structure

```text
openbank/
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── openbank/
│   │   │               │
│   │   │               ├── controller/
│   │   │               │   ├── HealthController.java
│   │   │               │   ├── InfoController.java
│   │   │               │   ├── CustomerController.java
│   │   │               │   ├── AccountController.java
│   │   │               │   ├── TransactionController.java
│   │   │               │   ├── BeneficiaryController.java
│   │   │               │   └── ConsentController.java
│   │   │               │
│   │   │               ├── dto/
│   │   │               │   ├── CreateCustomerRequest.java
│   │   │               │   ├── UpdateCustomerRequest.java
│   │   │               │   ├── CreateAccountRequest.java
│   │   │               │   ├── UpdateAccountRequest.java
│   │   │               │   ├── CreateTransactionRequest.java
│   │   │               │   ├── CreateBeneficiaryRequest.java
│   │   │               │   ├── UpdateBeneficiaryRequest.java
│   │   │               │   ├── CreateConsentRequest.java
│   │   │               │   └── UpdateConsentRequest.java
│   │   │               │
│   │   │               ├── entity/
│   │   │               │   ├── Customer.java
│   │   │               │   ├── Account.java
│   │   │               │   ├── Transaction.java
│   │   │               │   ├── Beneficiary.java
│   │   │               │   └── Consent.java
│   │   │               │
│   │   │               ├── repository/
│   │   │               │   ├── CustomerRepository.java
│   │   │               │   ├── AccountRepository.java
│   │   │               │   ├── TransactionRepository.java
│   │   │               │   ├── BeneficiaryRepository.java
│   │   │               │   └── ConsentRepository.java
│   │   │               │
│   │   │               ├── service/
│   │   │               │   ├── CustomerService.java
│   │   │               │   ├── AccountService.java
│   │   │               │   ├── TransactionService.java
│   │   │               │   ├── BeneficiaryService.java
│   │   │               │   └── ConsentService.java
│   │   │               │
│   │   │               ├── exception/
│   │   │               │   ├── CustomerNotFoundException.java
│   │   │               │   ├── AccountNotFoundException.java
│   │   │               │   ├── TransactionNotFoundException.java
│   │   │               │   ├── BeneficiaryNotFoundException.java
│   │   │               │   ├── ConsentNotFoundException.java
│   │   │               │   ├── BusinessException.java
│   │   │               │   └── GlobalExceptionHandler.java
│   │   │               │
│   │   │               └── config/
│   │   │                   └── SecurityConfig.java
│   │   │
│   │   └── resources/
│   │       └── application.properties
│   │
│   ├── test/
│   │
│   └── ...
│
├── pom.xml
├── .gitignore
└── README.md
```

---

# Database

The application uses PostgreSQL.

### Database

```text
openbank
```

### Configuration

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/openbank
spring.datasource.username=postgres
spring.datasource.password=YOUR_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

> Do not commit the real database password to GitHub.

---

# Domain Model

The current database relationships are:

```text
Customer
   |
   | 1:N
   ↓
Account
   |
   | 1:N
   ↓
Transaction


Customer
   |
   | 1:N
   ↓
Beneficiary


Customer
   |
   | 1:N
   ↓
Consent
```

---

# 1. Customer Management

Customer represents a bank customer.

### Customer fields

```text
id
name
email
phone
created_at
```

### APIs

| Method | Endpoint              | Description                                       |
| ------ | --------------------- | ------------------------------------------------- |
| POST   | `/api/customers`      | Create customer                                   |
| GET    | `/api/customers`      | Get all customers                                 |
| GET    | `/api/customers/{id}` | Get customer                                      |
| PUT    | `/api/customers/{id}` | Update customer                                   |
| DELETE | `/api/customers/{id}` | Delete/close customer according to implementation |

### Validation

Customer request validation includes:

```text
Name
    ↓
@NotBlank

Email
    ↓
@NotBlank
@Email

Phone
    ↓
@NotBlank
@Pattern
```

Example:

```json
{
    "name": "Madhan",
    "email": "madhan@gmail.com",
    "phone": "9876543210"
}
```

---

# 2. Account Management

Account represents a customer's bank account.

### Account fields

```text
id
account_number
account_type
balance
status
customer_id
created_at
```

### APIs

| Method | Endpoint                              | Description             |
| ------ | ------------------------------------- | ----------------------- |
| POST   | `/api/accounts`                       | Create account          |
| GET    | `/api/accounts`                       | Get all accounts        |
| GET    | `/api/accounts/{id}`                  | Get account             |
| GET    | `/api/accounts/customer/{customerId}` | Get customer's accounts |
| PUT    | `/api/accounts/{id}`                  | Update account          |
| DELETE | `/api/accounts/{id}`                  | Close account           |

### Important business rule

Account balance is not directly changed through account update APIs.

Balance changes through transactions.

Account deletion is implemented as a logical close:

```text
ACTIVE → CLOSED
```

This preserves banking history.

### Validation

```text
accountNumber → @NotBlank
accountType   → @NotBlank
customerId    → @NotNull
```

---

# 3. Transaction Management

Transactions record deposits and withdrawals.

### Transaction fields

```text
id
account_id
type
amount
balance_after
description
transaction_date
```

### APIs

| Method | Endpoint                                | Description              |
| ------ | --------------------------------------- | ------------------------ |
| POST   | `/api/transactions`                     | Create transaction       |
| GET    | `/api/transactions`                     | Get all transactions     |
| GET    | `/api/transactions/{id}`                | Get transaction          |
| GET    | `/api/transactions/account/{accountId}` | Get account transactions |

### Supported transaction types

```text
DEPOSIT
WITHDRAWAL
```

### Transaction validation

```text
accountId
    ↓
@NotNull

type
    ↓
@NotBlank

amount
    ↓
@NotNull
@DecimalMin("0.01")
```

### Business rules

* Closed accounts cannot perform transactions.
* Amount must be greater than zero.
* Withdrawal cannot exceed account balance.
* Transaction type must be `DEPOSIT` or `WITHDRAWAL`.

### Transaction safety

The transaction creation operation uses:

```java
@Transactional
```

This ensures the account balance update and transaction insertion are treated as one database transaction.

---

# 4. Beneficiary Management

A beneficiary represents an external bank account registered by a customer.

### Beneficiary fields

```text
id
name
account_number
bank_name
ifsc_code
customer_id
created_at
status
```

### APIs

| Method | Endpoint                                   | Description                  |
| ------ | ------------------------------------------ | ---------------------------- |
| POST   | `/api/beneficiaries`                       | Create beneficiary           |
| GET    | `/api/beneficiaries`                       | Get all beneficiaries        |
| GET    | `/api/beneficiaries/{id}`                  | Get beneficiary              |
| GET    | `/api/beneficiaries/customer/{customerId}` | Get customer's beneficiaries |
| PUT    | `/api/beneficiaries/{id}`                  | Update beneficiary           |
| PATCH  | `/api/beneficiaries/{id}`                  | Partially update beneficiary |
| DELETE | `/api/beneficiaries/{id}`                  | Deactivate beneficiary       |

### Validation

```text
customerId
    ↓
@NotNull

name
    ↓
@NotBlank
@Size

accountNumber
    ↓
@NotBlank
@Pattern

bankName
    ↓
@NotBlank

ifscCode
    ↓
@NotBlank
@Pattern
```

### Beneficiary status

```text
ACTIVE
   ↓
INACTIVE
```

Deletion is implemented as a logical deactivation to preserve the beneficiary record.

---

# 5. Consent Management

Consent Management is the core Open Banking feature of the application.

A consent represents permission for access to specified customer data.

### Consent fields

```text
id
customer_id
purpose
data_access
status
created_at
updated_at
expires_at
```

### Consent status

```text
PENDING
APPROVED
REJECTED
EXPIRED
```

Current implemented lifecycle:

```text
              ┌───────────┐
              │  PENDING  │
              └─────┬─────┘
                    / \
                   /   \
                  ↓     ↓
             APPROVED  REJECTED
```

### APIs

| Method | Endpoint                              | Description            |
| ------ | ------------------------------------- | ---------------------- |
| POST   | `/api/consents`                       | Create consent         |
| GET    | `/api/consents`                       | Get all consents       |
| GET    | `/api/consents/{id}`                  | Get consent            |
| GET    | `/api/consents/customer/{customerId}` | Get customer consents  |
| PUT    | `/api/consents/{id}`                  | Approve/reject consent |

### Create Consent

```http
POST /api/consents
```

```json
{
    "customerId": 1,
    "purpose": "Account Information Access",
    "dataAccess": "ACCOUNT",
    "expiresAt": "2026-12-31T23:59:59"
}
```

A newly created consent automatically receives:

```text
status = PENDING
```

### Approve Consent

```http
PUT /api/consents/1
```

```json
{
    "status": "APPROVED"
}
```

### Reject Consent

```http
PUT /api/consents/2
```

```json
{
    "status": "REJECTED"
}
```

### Consent validation

```text
customerId
    ↓
@NotNull

purpose
    ↓
@NotBlank

dataAccess
    ↓
@NotBlank

expiresAt
    ↓
@Future
```

Update validation:

```text
status
    ↓
@NotBlank
@Pattern
    ↓
APPROVED or REJECTED
```

### Consent business rule

Only a `PENDING` consent can be approved or rejected.

```text
PENDING → APPROVED    ✅
PENDING → REJECTED    ✅

APPROVED → REJECTED   ❌
REJECTED → APPROVED   ❌
```

---

# Validation Architecture

Bean Validation is used at the DTO layer.

Example:

```java
@Valid
@RequestBody CreateCustomerRequest request
```

Validation annotations include:

```text
@NotBlank
@NotNull
@Email
@Pattern
@Size
@DecimalMin
@Future
```

### Validation flow

```text
Postman
   ↓
HTTP Request
   ↓
Controller
   ↓
@RequestBody
   ↓
DTO
   ↓
@Valid
   ↓
Bean Validation
   ↓
Valid?
 ┌─┴───────────┐
 │             │
YES            NO
 │             │
 ↓             ↓
Service    MethodArgumentNotValidException
 │             │
 ↓             ↓
Database   GlobalExceptionHandler
             │
             ↓
          HTTP 400
```

---

# Exception Handling

The application uses custom exceptions instead of generic exceptions for important cases.

Current custom exceptions:

```text
CustomerNotFoundException
AccountNotFoundException
TransactionNotFoundException
BeneficiaryNotFoundException
ConsentNotFoundException
BusinessException
```

All are handled centrally using:

```java
@RestControllerAdvice
public class GlobalExceptionHandler
```

### Example error response

```json
{
    "status": 404,
    "message": "Customer not found with id: 10",
    "timestamp": "2026-09-30T10:30:00"
}
```

### Validation error response

```json
{
    "status": 400,
    "message": "Validation failed",
    "errors": {
        "email": "Email must be valid",
        "phone": "Phone number must contain exactly 10 digits"
    },
    "timestamp": "2026-09-30T10:30:00"
}
```

---

# API Testing

Postman is currently used for API testing.

Testing includes:

* Valid requests
* Missing required fields
* Invalid email
* Invalid phone number
* Invalid account number
* Invalid IFSC code
* Invalid transaction amount
* Invalid transaction type
* Non-existent customer
* Non-existent account
* Non-existent transaction
* Non-existent beneficiary
* Non-existent consent
* Invalid consent status
* Invalid consent lifecycle transitions
* Insufficient account balance
* Closed account transaction attempts

---

# Initial Security Configuration

Spring Security has been added to the project.

Currently:

```text
/health
/api/info
```

are publicly accessible.

Other APIs require authentication under the current security configuration.

Full authentication and authorization using Keycloak will be implemented in a later phase.

---

# Health Check

### API

```http
GET /health
```

Response:

```json
{
    "status": "UP"
}
```

---

# Application Information

### API

```http
GET /api/info
```

Response:

```json
{
    "application": "OpenBank Consent Hub",
    "version": "1.0.0",
    "status": "Development"
}
```

---

# How to Run

## 1. Start PostgreSQL

Make sure PostgreSQL is running.

Create the database:

```sql
CREATE DATABASE openbank;
```

---

## 2. Configure `application.properties`

```properties
spring.application.name=openbank

spring.datasource.url=jdbc:postgresql://localhost:5432/openbank
spring.datasource.username=postgres
spring.datasource.password=YOUR_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

---

## 3. Run the application

Using Maven:

```bash
mvn spring-boot:run
```

The application runs on:

```text
http://localhost:8081
```

---

# Future Development

The following features are planned for the next phases.

## Phase 1 — Backend Completion

* [x] Customer Management
* [x] Account Management
* [x] Transaction Management
* [x] Beneficiary Management
* [x] Consent Management
* [x] DTOs
* [x] Bean Validation
* [x] Custom Exceptions
* [x] Global Exception Handling

## Phase 2 — Authentication and Authorization

* [ ] Keycloak setup
* [ ] JWT authentication
* [ ] OAuth2/OIDC
* [ ] Role-Based Access Control
* [ ] CUSTOMER role
* [ ] MAKER role
* [ ] CHECKER role
* [ ] ADMIN role
* [ ] Secure API endpoints

## Phase 3 — Maker/Checker Workflow

```text
MAKER
  ↓
Create Consent
  ↓
PENDING
  ↓
CHECKER
  ↓
APPROVE / REJECT
```

## Phase 4 — React Frontend

Planned frontend features:

* Login
* Customer dashboard
* Account dashboard
* Transaction history
* Beneficiary management
* Consent management
* Maker dashboard
* Checker dashboard
* Admin dashboard

## Phase 5 — Nginx

Planned architecture:

```text
             Client
                |
                ↓
              Nginx
           /    |    \
          /     |     \
       React  Backend  Keycloak
                 |
                 ↓
             PostgreSQL
```

## Phase 6 — Docker

Planned Docker Compose services:

```text
React
Spring Boot
PostgreSQL
Keycloak
Nginx
```

## Phase 7 — Final Testing and Documentation

* [ ] Integration testing
* [ ] Security testing
* [ ] API documentation
* [ ] Docker deployment
* [ ] Final project demonstration
* [ ] Project presentation

---

# Development Progress

```text
Customer              ████████████████████ 100%
Customer Validation   ████████████████████ 100%

Account               ████████████████████ 100%
Account Validation    ████████████████████ 100%

Transaction           ████████████████████ 100%
Transaction Validation████████████████████ 100%

Beneficiary           ████████████████████ 100%
Beneficiary Validation████████████████████ 100%

Consent               ████████████████████ 100%
Consent Validation    ████████████████████ 100%

Keycloak              ░░░░░░░░░░░░░░░░░░░░   0%
React Frontend        ░░░░░░░░░░░░░░░░░░░░   0%
Nginx                 ░░░░░░░░░░░░░░░░░░░░   0%
Docker Compose        ░░░░░░░░░░░░░░░░░░░░   0%
```

---

# Project Goal

The final goal is to build a secure Open Banking Consent Management platform with:

```text
                    OpenBank Consent Hub

                           Client
                             |
                             ↓
                           Nginx
                             |
              ┌──────────────┼──────────────┐
              ↓              ↓              ↓
           React         Spring Boot     Keycloak
                            |
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
          Customer       Account        Consent
             |              |
             ↓              ↓
        Beneficiary     Transaction
                            |
                            ↓
                       PostgreSQL
```

The completed system will combine banking operations, consent management, authentication, authorization, and a modern web frontend into a single Open Banking application.
