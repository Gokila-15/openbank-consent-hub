# OpenBank Consent Hub

## Overview

OpenBank Consent Hub is an Open Banking Consent Management System being developed using Spring Boot and PostgreSQL.

The project aims to provide a secure banking backend with customer management, account management, transaction processing, beneficiary management, and Open Banking consent workflows.

The current implementation focuses on the initial backend foundation and core Customer and Account APIs.

---

## Technology Stack

### Currently Used

* Java 21
* Spring Boot
* Spring Web
* Spring Data JPA
* Hibernate
* PostgreSQL
* Maven
* Postman
* Git

### Planned

* React
* Spring Security
* Keycloak
* JWT
* Nginx
* Docker
* Docker Compose

---

## Backend Architecture

The backend follows a layered architecture:

```text
Client / Postman
       |
       v
Controller
       |
       v
Service
       |
       v
Repository
       |
       v
Hibernate / JPA
       |
       v
PostgreSQL
```

### Package Structure

```text
src/main/java/com/banfico/openbank/

├── controller/
├── service/
├── repository/
├── entity/
├── dto/
├── exception/
├── config/
└── OpenBankApplication.java
```

### Package Responsibilities

| Package      | Responsibility                          |
| ------------ | --------------------------------------- |
| `controller` | Handles HTTP requests and responses     |
| `service`    | Contains business logic                 |
| `repository` | Handles database operations             |
| `entity`     | Represents database entities            |
| `dto`        | Contains API request/response objects   |
| `exception`  | Reserved for application error handling |
| `config`     | Contains application configuration      |

---

# Current Progress

## Day 1 — Backend Foundation

Completed:

* Spring Boot project created
* Maven configuration
* Backend package structure
* PostgreSQL database configuration
* JPA/Hibernate configuration
* Spring Security basic configuration
* Health API
* Application information API
* Postman testing
* Git repository setup

### Health API

```http
GET /health
```

Response:

```json
{
  "status": "UP"
}
```

### Application Information API

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

# Day 2 — Customer Management

Customer CRUD APIs have been implemented.

## Customer Entity

The current Customer entity contains:

```text
id
name
email
phone
createdAt
```

## Customer APIs

### Create Customer

```http
POST /api/customers
```

Example request:

```json
{
  "name": "Madhan",
  "email": "madhan@example.com",
  "phone": "9876543210"
}
```

### Get All Customers

```http
GET /api/customers
```

### Get Customer by ID

```http
GET /api/customers/{id}
```

### Update Customer

```http
PUT /api/customers/{id}
```

### Partially Update Customer

```http
PATCH /api/customers/{id}
```

### Delete Customer

```http
DELETE /api/customers/{id}
```

---

# Day 2 — Account Management

Account management APIs have been implemented.

## Account Entity

The current Account entity contains:

```text
id
accountNumber
accountType
balance
status
customer
createdAt
```

The Account entity has a relationship with Customer:

```text
Customer
   |
   | 1
   |
   | *
   v
Account
```

A single customer can have multiple accounts.

---

## Account APIs

### Create Account

```http
POST /api/accounts
```

Example request:

```json
{
  "accountNumber": "ACC10001",
  "accountType": "SAVINGS",
  "customerId": 1
}
```

A newly created account starts with:

```text
balance = 0
status = ACTIVE
```

---

### Get All Accounts

```http
GET /api/accounts
```

---

### Get Account by ID

```http
GET /api/accounts/{id}
```

---

### Get Accounts by Customer

```http
GET /api/accounts/customer/{customerId}
```

---

### Update Account

```http
PUT /api/accounts/{id}
```

Example:

```json
{
  "accountType": "CURRENT",
  "status": "ACTIVE"
}
```

---

### Partially Update Account

```http
PATCH /api/accounts/{id}
```

Example:

```json
{
  "status": "ACTIVE"
}
```

---

### Close Account

```http
DELETE /api/accounts/{id}
```

The current implementation does not physically remove the account.

Instead, the account status is changed:

```text
ACTIVE
   |
   v
CLOSED
```

This preserves the account record for future banking transaction history.

---

# Database Design

Current database relationships:

```text
Customer
   |
   | 1
   |
   | *
   v
Account
```

Current tables:

```text
customers
-------------------------
id
name
email
phone
created_at


accounts
-------------------------
id
account_number
account_type
balance
status
customer_id
created_at
```

`accounts.customer_id` is a foreign key referencing:

```text
customers.id
```

---

# Account Design Decision

Account balance is not directly modified through the Account update APIs.

The balance will be changed through the Transaction module.

For example:

```text
Deposit
   |
   v
Transaction
   |
   v
Update Account Balance
```

This prevents a client from directly sending:

```json
{
  "balance": 999999
}
```

and changing the account balance without a corresponding banking transaction.

---

# Current API Summary

## Customer

```text
POST   /api/customers
GET    /api/customers
GET    /api/customers/{id}
PUT    /api/customers/{id}
PATCH  /api/customers/{id}
DELETE /api/customers/{id}
```

## Account

```text
POST   /api/accounts
GET    /api/accounts
GET    /api/accounts/{id}
GET    /api/accounts/customer/{customerId}
PUT    /api/accounts/{id}
PATCH  /api/accounts/{id}
DELETE /api/accounts/{id}
```

---

# Local Setup

## Prerequisites

Install:

* Java 21
* Maven
* PostgreSQL
* Postman
* Git

## Create Database

Create the PostgreSQL database:

```sql
CREATE DATABASE openbank;
```

## Configure Database

Update:

```text
src/main/resources/application.properties
```

Example:

```properties
spring.application.name=openbank

spring.datasource.url=jdbc:postgresql://localhost:5432/openbank
spring.datasource.username=postgres
spring.datasource.password=YOUR_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

Replace `YOUR_PASSWORD` with the local PostgreSQL password.

Do not commit real credentials to GitHub.

---

# Running the Application

Start the Spring Boot application using IntelliJ or:

```bash
mvn spring-boot:run
```

The application currently runs on:

```text
http://localhost:8081
```

if port `8081` is configured.

---

# Testing

The APIs are being tested using Postman.

Example:

```http
GET http://localhost:8081/health
```

```http
GET http://localhost:8081/api/info
```

Customer:

```http
POST http://localhost:8081/api/customers
```

Account:

```http
POST http://localhost:8081/api/accounts
```

---

# Project Status

### Completed

* [x] Spring Boot project setup
* [x] Backend package structure
* [x] PostgreSQL configuration
* [x] JPA/Hibernate configuration
* [x] Health API
* [x] Application Info API
* [x] Customer Entity
* [x] Customer Repository
* [x] Customer Service
* [x] Customer Controller
* [x] Customer CRUD APIs
* [x] Account Entity
* [x] Account Repository
* [x] Account Service
* [x] Account Controller
* [x] Account CRUD/update APIs
* [x] Customer-Account relationship
* [x] Postman testing

### Not Yet Implemented

* [ ] Transaction management
* [ ] Beneficiary management
* [ ] Request validation
* [ ] Custom exceptions
* [ ] Global exception handling
* [ ] Consent management
* [ ] Consent expiry
* [ ] Consent audit trail
* [ ] Maker-Checker workflow
* [ ] Keycloak authentication
* [ ] JWT authorization
* [ ] Role-based access control
* [ ] React frontend
* [ ] Nginx gateway
* [ ] Docker
* [ ] Docker Compose

---

# Planned Roles

The final system will use four roles:

```text
CUSTOMER
MAKER
CHECKER
ADMIN
```

Role-based authorization will be implemented later using Keycloak and Spring Security.

The current backend APIs are still under development and are not yet protected by the final role-based authorization system.

---

# Planned Project Flow

The final application is planned to follow:

```text
User
  |
  v
React Frontend
  |
  v
Nginx
  |
  +------------------+
  |                  |
  v                  v
Spring Boot       Keycloak
  |
  v
Spring Security
  |
  v
Controller
  |
  v
Service
  |
  v
Repository
  |
  v
Hibernate / JPA
  |
  v
PostgreSQL
```

---

# Upcoming Development

## Day 3

Transaction and Beneficiary management.

Planned transaction features:

* Deposit
* Withdrawal
* Balance validation
* Insufficient balance handling
* Transaction history
* Atomic database operations

Planned beneficiary features:

* Create beneficiary
* View beneficiaries
* Update beneficiary
* Delete beneficiary

## Day 4

* Request validation
* Custom exceptions
* Global exception handling
* Proper API error responses

## Day 5

Open Banking Consent Management:

* Consent creation
* Purpose
* Data scope
* Consent status
* Expiry
* Maker-Checker workflow
* Approval/rejection
* Audit trail

## Later Stages

* React frontend
* Keycloak
* JWT
* Role-based authorization
* Nginx
* Docker Compose
* Full system integration

---

# Project Goal

The final goal is to build a secure Open Banking Consent Management System that demonstrates:

* REST API development
* Spring Boot
* JPA/Hibernate
* PostgreSQL
* Banking business logic
* Secure authentication
* Role-based authorization
* Maker-Checker workflow
* Fine-grained consent
* Consent expiry
* Audit trail
* Frontend-backend integration
* API gateway
* Containerization
