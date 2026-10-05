import { useState } from "react";
import type { Customer, UpdateCustomerRequest } from "../../../types";
import { customerService } from "../../../services/customerService";

interface ProfileViewProps {
  customer: Customer | null;
  loading: boolean;
  error: string | null;
  onUpdateSuccess: (updated: Customer) => void;
  onRefresh: () => void;
}

export default function ProfileView({
  customer,
  loading,
  error,
  onUpdateSuccess,
  onRefresh,
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateCustomerRequest>({
    name: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const startEdit = () => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
      });
      setEditError(null);
      setSuccessMsg(null);
      setIsEditing(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setEditError("All fields are required.");
      return;
    }

    try {
      setSubmitting(true);
      setEditError(null);
      const updated = await customerService.updateCustomer(customer.id, formData);
      onUpdateSuccess(updated);
      setSuccessMsg("Profile updated successfully.");
      setIsEditing(false);
    } catch (err: unknown) {
      console.error("Failed to update profile:", err);
      setEditError("Failed to update profile. Please verify your input and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="view-card skeleton-container">
        <div className="skeleton-title"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <p className="loading-text">Loading profile...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="view-card error-card">
        <h3>Unable to load customer profile</h3>
        <p>{error || "Customer record could not be found."}</p>
        <button className="primary-button" onClick={onRefresh}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="section-header-modern">
        <div>
          <h2>My Profile</h2>
          <p>View and manage your registered personal information</p>
        </div>
        <button className="primary-button" onClick={startEdit}>
          ✏️ Edit Profile
        </button>
      </div>

      {successMsg && (
        <div className="alert-box success-alert">
          <span>✓ {successMsg}</span>
          <button className="alert-close" onClick={() => setSuccessMsg(null)}>×</button>
        </div>
      )}

      {editError && (
        <div className="alert-box error-alert">
          <span>⚠️ {editError}</span>
          <button className="alert-close" onClick={() => setEditError(null)}>×</button>
        </div>
      )}

      <div className="profile-grid">
        <div className="view-card profile-main-card">
          <div className="profile-badge-header">
            <div className="profile-avatar-large">
              {customer.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h3>{customer.name}</h3>
              <span className="customer-tag">Verified Customer</span>
            </div>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-item">
              <span className="detail-label">Customer ID</span>
              <span className="detail-value font-mono">#{customer.id}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Username</span>
              <span className="detail-value">{customer.username || "N/A"}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Email Address</span>
              <span className="detail-value">{customer.email}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Phone Number</span>
              <span className="detail-value">{customer.phone}</span>
            </div>
            {customer.createdAt && (
              <div className="profile-detail-item">
                <span className="detail-label">Member Since</span>
                <span className="detail-value">
                  {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="view-card security-overview-card">
          <h3>Security & Account Access</h3>
          <p className="subtext">Your account security settings and authentication details.</p>
          
          <div className="security-badges">
            <div className="security-item">
              <div className="security-icon">🛡️</div>
              <div>
                <strong>Single Sign-On (SSO)</strong>
                <p>Secured via OpenBank Keycloak OIDC authentication</p>
              </div>
            </div>
            <div className="security-item">
              <div className="security-icon">🔒</div>
              <div>
                <strong>Role Authorization</strong>
                <p>CUSTOMER role active with scoped resource protection</p>
              </div>
            </div>
            <div className="security-item">
              <div className="security-icon">📑</div>
              <div>
                <strong>Consent Hub Protocol</strong>
                <p>Third-party data sharing protected by checker verification</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Edit Personal Information</h3>
              <button className="modal-close" onClick={() => setIsEditing(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="customer-name">Full Name</label>
                  <input
                    id="customer-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="customer-email">Email Address</label>
                  <input
                    id="customer-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="customer-phone">Phone Number</label>
                  <input
                    id="customer-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsEditing(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
