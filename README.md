# OpenBank Consent Management System

A secure **Open Banking Consent Management System** built using Spring Boot, React, PostgreSQL, Keycloak, Docker, and Nginx.

The system manages customers, bank accounts, transactions, beneficiaries, and consent requests while implementing **OAuth 2.0 / OpenID Connect authentication**, **JWT-based authorization**, and **role-based access control** using Keycloak.

---

## 📌 Project Overview

The OpenBank Consent Management System is designed to demonstrate how an Open Banking platform can securely manage customer data access through a **consent-based workflow**.

A customer can create a consent request specifying:

- Purpose of data access
- Type of data that can be accessed
- Consent status
- Expiration date

The consent then follows a **Maker–Checker workflow**, where authorized users can review and approve or reject requests.

### Main Workflow

```text
Customer
   │
   │ Create Consent
   ▼
Pending Consent
   │
   ├───────────────┐
   │               │
   ▼               ▼
Checker          Admin
   │               │
   └───────┬───────┘
           │
     Approve / Reject
           │
           ▼
     Final Consent Status
```

---

# 🏗️ System Architecture

```text
                    ┌──────────────────┐
                    │     Browser      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │      React       │
                    │    Frontend      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │      Nginx       │
                    │  Reverse Proxy   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Spring Boot    │
                    │      REST API    │
                    └────────┬─────────┘
                             │
                  ┌──────────┴──────────┐
                  ▼                     ▼
        ┌──────────────────┐   ┌──────────────────┐
        │    PostgreSQL    │   │     Keycloak     │
        │     Database     │   │ Authentication   │
        └──────────────────┘   └──────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Axios
- HTML
- CSS

## Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- REST APIs
- Maven

## Database

- PostgreSQL 16

## Authentication & Authorization

- Keycloak
- OAuth 2.0
- OpenID Connect
- JWT
- Role-Based Access Control (RBAC)

## Infrastructure

- Docker
- Docker Compose
- Nginx

## API Testing

- Postman

---

# 👥 User Roles

The system contains four roles.

| Role | Responsibility |
|---|---|
| CUSTOMER | Manage own banking information and create consent requests |
| MAKER | Perform operational activities and create banking/consent records |
| CHECKER | Review and approve/reject consent requests |
| ADMIN | Administrative access and consent approval/rejection |

### Role Structure

```text
                    OpenBank System
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      CUSTOMER         MAKER          CHECKER
          │              │              │
          │              │              │
          └──────────────┴──────┬───────┘
                                │
                              ADMIN
```

There can be:

- 1 ADMIN
- 1 MAKER
- 1 CHECKER
- Multiple CUSTOMERS

---

# 🔐 Authentication Flow

Authentication is handled by Keycloak.

```text
User
 │
 ▼
React Application
 │
 ▼
Keycloak Login
 │
 ▼
Username + Password
 │
 ▼
Keycloak
 │
 ▼
JWT Access Token
 │
 ▼
React
 │
 ▼
Axios Authorization Header
 │
 │ Bearer <JWT>
 ▼
Spring Boot
 │
 ▼
JWT Validation
 │
 ▼
Role Extraction
 │
 ▼
Role-Based Authorization
```

The backend extracts roles from the JWT and converts them into Spring Security authorities.

Example:

```text
CUSTOMER → ROLE_CUSTOMER
MAKER    → ROLE_MAKER
CHECKER  → ROLE_CHECKER
ADMIN    → ROLE_ADMIN
```

---

# 🔑 Keycloak Configuration

Keycloak runs on:

```text
http://localhost:8080
```

Realm:

```text
openbank
```

Frontend client:

```text
openbank-frontend
```

The frontend uses the Keycloak JavaScript client to authenticate users.

The backend acts as an OAuth 2.0 Resource Server and validates JWT access tokens issued by Keycloak.

---

# 📦 Backend Modules

The Spring Boot backend contains the following major modules:

```text
Customer
   │
   ├── Account
   │
   ├── Transaction
   │
   ├── Beneficiary
   │
   └── Consent
```

### Customer

Manages customer information such as:

- Name
- Email
- Phone number

### Account

Manages customer bank accounts.

### Transaction

Manages banking transactions and validates transaction amounts.

### Beneficiary

Manages beneficiaries associated with banking accounts.

### Consent

Manages:

- Consent creation
- Consent status
- Purpose
- Data access
- Approval
- Rejection
- Expiration
- Audit information

---

# 🔄 Consent Management Workflow

A consent can move through different states.

```text
        ┌─────────────┐
        │   PENDING   │
        └──────┬──────┘
               │
        ┌──────┴───────┐
        │              │
        ▼              ▼
   ┌─────────┐    ┌─────────┐
   │ APPROVED│    │ REJECTED│
   └─────────┘    └─────────┘
```

The system also stores audit information such as:

- Created By
- Created At
- Approved By
- Approved At
- Rejected By
- Rejected At
- Updated At
- Expiry Date

### Maker–Checker Security

The user who creates a consent cannot approve or reject the same consent.

This prevents self-approval and provides separation of duties.

---

# 🔒 Security Features

The project implements:

- OAuth 2.0 authentication
- OpenID Connect
- JWT authentication
- Role-Based Access Control
- Customer ownership validation
- Maker–Checker workflow
- Self-approval prevention
- Input validation
- Custom exceptions
- Global exception handling
- CORS configuration
- Secure API endpoints

---

# 🗄️ Database

PostgreSQL is used as the primary application database.

Database:

```text
openbank
```

Container:

```text
openbank-db
```

Host port:

```text
5433
```

Container port:

```text
5432
```

Persistent Docker volume:

```text
openbank-db-data
```

The database uses a persistent Docker volume so that restarting or recreating the application containers does not remove the database data.

---

# 🐳 Docker Architecture

The OpenBank application is containerized using Docker Compose.

```text
                Docker Compose
                     │
       ┌─────────────┼─────────────┐
       │             │             │
       ▼             ▼             ▼
 openbank-db   openbank-api   openbank-frontend
       │             │             │
       └─────────────┼─────────────┘
                     │
                     ▼
               openbank-nginx
```

### Containers

| Container | Purpose | Port |
|---|---|---|
| openbank-db | PostgreSQL database | 5433 |
| openbank-api | Spring Boot backend | 8081 |
| openbank-frontend | React frontend | 5173 |
| openbank-nginx | Reverse proxy/gateway | 8090 |
| keycloak | Authentication server | 8080 |
| keycloak-db | Keycloak database | Internal |

---

# 🌐 Application URLs

### Main Application

```text
http://localhost:8090
```

### React Frontend

```text
http://localhost:5173
```

### Spring Boot API

```text
http://localhost:8081
```

### Keycloak

```text
http://localhost:8080
```

---

# ⚙️ Project Structure

```text
openbank/
│
├── src/
│   └── main/
│       └── java/
│           └── com/example/openbank/
│               │
│               ├── config/
│               ├── controller/
│               ├── service/
│               ├── repository/
│               ├── entity/
│               ├── dto/
│               └── exception/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── nginx/
│   └── nginx.conf
│
├── target/
│   └── openbank-0.0.1-SNAPSHOT.jar
│
├── Dockerfile
├── docker-compose.yml
├── .env
├── .gitignore
├── pom.xml
└── README.md
```

---

# 🚀 Running the Project

## Prerequisites

Install:

- Java 21
- Maven
- Node.js
- Docker Desktop
- PostgreSQL
- Postman

---

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd openbank
```

---

## 2. Configure Environment Variables

Create a `.env` file in the project root:

```text
OPENBANK_DB_PASSWORD=<your-postgresql-password>
```

Do **not** commit `.env` to Git.

`.gitignore` should contain:

```text
.env
```

---

## 3. Build the Backend

```bash
mvn package -DskipTests
```

---

## 4. Start Docker Compose

```bash
docker compose up -d --build
```

---

## 5. Check Containers

```bash
docker compose ps
```

Expected services:

```text
openbank-db
openbank-api
openbank-frontend
openbank-nginx
```

---

# 🛑 Stop the Application

```bash
docker compose down
```

This stops and removes the Compose containers.

The PostgreSQL data remains stored in:

```text
openbank-db-data
```

Do not remove the volume unless you intentionally want to delete the database data.

---

# 🔄 Restart the Application

```bash
docker compose up -d
```

If backend or frontend code has changed and a new image is required:

```bash
docker compose up -d --build
```

---

# 🧪 API Testing

The APIs can be tested using Postman.

Authentication is performed using Keycloak and the generated JWT access token is sent as:

```http
Authorization: Bearer <access-token>
```

Example:

```http
GET /api/customers/8
Authorization: Bearer <JWT>
```

---

# 🛡️ Error Handling

The backend contains custom exceptions for resources such as:

- Customer not found
- Account not found
- Beneficiary not found
- Transaction-related validation errors
- Consent-related errors

A global exception handler provides consistent API error responses.

---

# 🧪 Validation

The system performs validation for:

- Customer details
- Email addresses
- Phone numbers
- Account information
- Transaction amounts
- Beneficiary information
- Consent information

Invalid requests are rejected with appropriate error responses.

---

# 🔐 Security Architecture

```text
                    Keycloak
                       │
                       │ JWT
                       ▼
React ────────────► Spring Security
                       │
                       ▼
               JWT Authentication
                       │
                       ▼
                Role Extraction
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      CUSTOMER       MAKER       CHECKER
                                      │
                                      ▼
                                    ADMIN
```

---

# 📈 Future Enhancements

Possible future improvements include:

- Open Banking API standardization
- Consent notification system
- Email notifications
- Refresh-token handling improvements
- Audit-log dashboard
- API documentation using Swagger/OpenAPI
- CI/CD pipeline
- Cloud deployment
- Kubernetes deployment
- Monitoring and logging
- Automated integration testing

---

# 👨‍💻 Project Purpose

This project demonstrates practical implementation of:

- Full-stack application development
- REST API development
- Secure authentication
- OAuth 2.0 / OIDC
- JWT-based authorization
- Role-based access control
- Maker–Checker workflow
- PostgreSQL persistence
- Docker containerization
- Docker Compose orchestration
- Nginx reverse proxy
- React frontend integration

---

# 📌 Project Status

**Status: Completed Core Implementation**

Implemented:

- Customer Management
- Account Management
- Transaction Management
- Beneficiary Management
- Consent Management
- Customer / Maker / Checker / Admin roles
- Keycloak authentication
- JWT authorization
- Role-based access control
- Maker–Checker workflow
- Self-approval prevention
- Input validation
- Global exception handling
- React dashboards
- Dockerized backend
- Dockerized frontend
- PostgreSQL persistence
- Nginx gateway
- Docker Compose deployment

---

## 👤 Author

**Gokila S**

B.Tech Information Technology  
Government College of Technology, Coimbatore