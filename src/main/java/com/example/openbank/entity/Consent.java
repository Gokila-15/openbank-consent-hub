package com.example.openbank.entity;


import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consents")
public class Consent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false)
    private String purpose;

    @Column(name = "data_access", nullable = false)
    private String dataAccess;

    @Column(nullable = false)
    private String status;

  @Column(name = "created_by", nullable = false)
private String createdBy;

@Column(name = "created_at", nullable = false)
private LocalDateTime createdAt;

@Column(name = "updated_at")
private LocalDateTime updatedAt;

@Column(name = "approved_by")
private String approvedBy;

@Column(name = "approved_at")
private LocalDateTime approvedAt;

@Column(name = "rejected_by")
private String rejectedBy;

@Column(name = "rejected_at")
private LocalDateTime rejectedAt;

@Column(name = "expires_at")
private LocalDateTime expiresAt;

    public Consent() {
    }

    @PrePersist
    public void prePersist() {

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        if (status == null) {
            status = "PENDING";
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getDataAccess() {
        return dataAccess;
    }

    public void setDataAccess(String dataAccess) {
        this.dataAccess = dataAccess;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }


    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    public String getCreatedBy() {
    return createdBy;
}

public void setCreatedBy(String createdBy) {
    this.createdBy = createdBy;
}
public String getApprovedBy() {
    return approvedBy;
}

public void setApprovedBy(String approvedBy) {
    this.approvedBy = approvedBy;
}

public LocalDateTime getApprovedAt() {
    return approvedAt;
}

public void setApprovedAt(LocalDateTime approvedAt) {
    this.approvedAt = approvedAt;
}

public String getRejectedBy() {
    return rejectedBy;
}

public void setRejectedBy(String rejectedBy) {
    this.rejectedBy = rejectedBy;
}

public LocalDateTime getRejectedAt() {
    return rejectedAt;
}

public void setRejectedAt(LocalDateTime rejectedAt) {
    this.rejectedAt = rejectedAt;
}
}
