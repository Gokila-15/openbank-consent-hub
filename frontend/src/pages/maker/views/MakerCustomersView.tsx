import { useState } from "react";
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from "../../../types";
import { customerService } from "../../../services/customerService";

interface MakerCustomersViewProps {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCustomersUpdated: () => void;
  onSelectCustomerForAccounts?: (customerId: number) => void;
  onSelectCustomerForConsents?: (customerId: number) => void;
}

export default function MakerCustomersView({
  customers,
  loading,
  error,
  onRefresh,
  onCustomersUpdated,
  onSelectCustomerForAccounts,
  onSelectCustomerForConsents,
}: MakerCustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // Form states for Create
  const [createForm, setCreateForm] = useState<CreateCustomerRequest>({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
  });

  // Form states for Edit
  const [editForm, setEditForm] = useState<UpdateCustomerRequest>({
    name: "",
    email: "",
    phone: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Validation
  const validatePhone = (phone: string) => /^[0-9]{10}$/.test(phone);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateUsername = (username: string) => /^[a-zA-Z0-9._-]+$/.test(username);

  const extractErrorMessage = (err: unknown, fallbackMessage: string): string => {
    const errorObj = err as any;
    if (errorObj?.response) {
      const status = errorObj.response.status;
      const data = errorObj.response.data;

      // 1. Direct string error
      if (typeof data === "string" && data.trim()) {
        return data.trim();
      }

      // 2. JSON error response
      if (data && typeof data === "object") {
        if (typeof data.message === "string" && data.message.trim()) {
          return data.message.trim();
        }
        if (typeof data.error === "string" && data.error.trim()) {
          return data.error.trim();
        }
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          const list = data.errors
            .map((e: any) =>
              typeof e === "string"
                ? e
                : e.defaultMessage || e.message || JSON.stringify(e)
            )
            .filter(Boolean);
          if (list.length > 0) return list.join(", ");
        }
        if (typeof data.errors === "object" && data.errors !== null) {
          const values = Object.values(data.errors)
            .map((v: any) => (typeof v === "string" ? v : JSON.stringify(v)))
            .filter(Boolean);
          if (values.length > 0) return values.join(", ");
        }
      }

      // 3. Fallback based on HTTP status code
      if (status === 400) return "Validation error: Please check the submitted fields.";
      if (status === 401) return "Authentication error: Session expired or unauthorized.";
      if (status === 403) return "Permission error: You do not have permission to perform this action.";
      if (status === 409) return "Conflict error: Username or email is already registered.";
      if (status === 500) return "Server error: Unable to process request. Please try again later.";
      return `Request failed with status code ${status}.`;
    }

    if (errorObj?.message && typeof errorObj.message === "string") {
      return errorObj.message;
    }

    return fallbackMessage;
  };

  const openAddModal = () => {
    setCreateForm({ name: "", lastName: "", email: "", phone: "", username: "", password: "" });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = createForm.name.trim();
    const lastName = createForm.lastName.trim();
    const email = createForm.email.trim();
    const phone = createForm.phone.trim();
    const username = createForm.username.trim();
    const password = createForm.password;

    if (!name) {
      setFormError("Full name is required.");
      return;
    }
    if (!lastName) {
      setFormError("Last name is required.");
      return;
    }
    if (!validateEmail(email)) {
      setFormError("A valid email address is required.");
      return;
    }
    if (!validatePhone(phone)) {
      setFormError("Phone number must contain exactly 10 digits.");
      return;
    }
    if (!username) {
      setFormError("Username is required.");
      return;
    }
    if (!validateUsername(username)) {
      setFormError("Username can only contain letters, numbers, dot (.), underscore (_), and hyphen (-).");
      return;
    }
    if (!password) {
      setFormError("Password is required.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setSubmitting(true);
      await customerService.createCustomer({
        name,
        lastName,
        email,
        phone,
        username,
        password,
      });
      setActionSuccess(`Customer "${name} ${lastName}" created successfully!`);
      setIsAddModalOpen(false);
      onCustomersUpdated();
    } catch (err: unknown) {
      console.error("Failed to create customer:", err);
      setFormError(extractErrorMessage(err, "Failed to create customer."));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
    });
    setFormError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setFormError(null);

    if (!editForm.name.trim()) {
      setFormError("Full name is required.");
      return;
    }
    if (!validateEmail(editForm.email.trim())) {
      setFormError("A valid email address is required.");
      return;
    }
    if (!validatePhone(editForm.phone.trim())) {
      setFormError("Phone number must contain exactly 10 digits.");
      return;
    }

    try {
      setSubmitting(true);
      await customerService.updateCustomer(editingCustomer.id, editForm);
      setActionSuccess("Customer details updated successfully!");
      setEditingCustomer(null);
      onCustomersUpdated();
    } catch (err: unknown) {
      console.error("Failed to update customer:", err);
      setFormError(extractErrorMessage(err, "Failed to update customer information. Please verify details."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingCustomer) return;

    try {
      setSubmitting(true);
      await customerService.deleteCustomer(deletingCustomer.id);
      setActionSuccess(`Customer #${deletingCustomer.id} (${deletingCustomer.name}) deleted.`);
      setDeletingCustomer(null);
      onCustomersUpdated();
    } catch (err: unknown) {
      console.error("Failed to delete customer:", err);
      setActionSuccess(null);
      alert(extractErrorMessage(err, "Failed to delete customer. Ensure associated accounts/consents are handled first."));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      String(c.id).includes(term) ||
      (c.username || "").toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="view-card skeleton-container">
        <div className="skeleton-title"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <p className="loading-text">Loading customer records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-card error-card">
        <h3>Unable to load customers</h3>
        <p>{error}</p>
        <button className="primary-button" onClick={onRefresh}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="section-header-modern">
      
        <div className="header-actions">
          <button className="secondary-button" onClick={onRefresh}>
            🔄 Refresh
          </button>
          <button className="primary-button" onClick={openAddModal}>
            + Create Customer
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert-box success-alert">
          <span>✓ {actionSuccess}</span>
          <button className="alert-close" onClick={() => setActionSuccess(null)}>×</button>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="view-card filter-bar-card">
        <div className="filter-group" style={{ maxWidth: "450px" }}>
          <label htmlFor="search-customer">Search Customers</label>
          <input
            id="search-customer"
            type="text"
            placeholder="Search by name, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="view-card">
        {filteredCustomers.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">👥</div>
            <h3>No Customers Found</h3>
            <p>
              {customers.length === 0
                ? "There are currently no customer profiles in the system."
                : "No customers matched your search query."}
            </p>
            {customers.length === 0 && (
              <button
                className="primary-button"
                onClick={openAddModal}
                style={{ marginTop: "12px" }}
              >
                + Create First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Keycloak Username</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono font-semibold">#{c.id}</td>
                    <td className="font-semibold">{c.name}</td>
                    <td className="text-muted-small">{c.email}</td>
                    <td className="font-mono">{c.phone}</td>
                    <td>
                      {c.username ? (
                        <span className="customer-tag">{c.username}</span>
                      ) : (
                        <span className="text-muted-small font-mono">Unlinked</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          className="table-action-btn"
                          onClick={() => setViewingCustomer(c)}
                        >
                          View
                        </button>
                        <button
                          className="table-action-btn"
                          onClick={() => openEditModal(c)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="table-action-btn"
                          style={{ borderColor: "#fca5a5", color: "#dc2626", background: "#fef2f2" }}
                          onClick={() => setDeletingCustomer(c)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Create New Customer</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box error-alert">
                    <span>⚠️ {formError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="maker-cust-name">Full Name *</label>
                  <input
                    id="maker-cust-name"
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Sankar"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maker-cust-lastname">Last Name *</label>
                  <input
                    id="maker-cust-lastname"
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    placeholder="e.g. Kumar"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maker-cust-email">Email Address *</label>
                  <input
                    id="maker-cust-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="e.g. sankar@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maker-cust-phone">Phone Number (10 digits) *</label>
                  <input
                    id="maker-cust-phone"
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    required
                  />
                  <small className="form-help">Must be exactly 10 numerical digits</small>
                </div>
                <div className="form-group">
                  <label htmlFor="maker-cust-username">Username *</label>
                  <input
                    id="maker-cust-username"
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="e.g. reshmi"
                    required
                  />
                  <small className="form-help">Letters, numbers, dot, underscore, and hyphen only</small>
                </div>
                <div className="form-group">
                  <label htmlFor="maker-cust-password">Password *</label>
                  <input
                    id="maker-cust-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="e.g. Reshmi@12345"
                    minLength={8}
                    required
                  />
                  <small className="form-help">Minimum 8 characters</small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Edit Customer #{editingCustomer.id}</h3>
              <button className="modal-close" onClick={() => setEditingCustomer(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box error-alert">
                    <span>⚠️ {formError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="edit-cust-name">Full Name *</label>
                  <input
                    id="edit-cust-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-cust-email">Email Address *</label>
                  <input
                    id="edit-cust-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-cust-phone">Phone Number *</label>
                  <input
                    id="edit-cust-phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingCustomer(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCustomer && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Delete Customer #{deletingCustomer.id}</h3>
              <button className="modal-close" onClick={() => setDeletingCustomer(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete customer <strong>{deletingCustomer.name}</strong> ({deletingCustomer.email})?
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeletingCustomer(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ background: "#dc2626" }}
                onClick={handleDeleteSubmit}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW CUSTOMER DETAILS MODAL */}
      {viewingCustomer && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Customer Overview</h3>
              <button className="modal-close" onClick={() => setViewingCustomer(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="detail-label">Customer ID</span>
                <span className="detail-value font-mono">#{viewingCustomer.id}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Name</span>
                <span className="detail-value font-bold">{viewingCustomer.name}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Email Address</span>
                <span className="detail-value">{viewingCustomer.email}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Phone</span>
                <span className="detail-value font-mono">{viewingCustomer.phone}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Linked Keycloak User</span>
                <span className="detail-value">{viewingCustomer.username || "None (Business Record Only)"}</span>
              </div>
              {viewingCustomer.createdAt && (
                <div className="modal-detail-row">
                  <span className="detail-label">Registered Date</span>
                  <span className="detail-value">
                    {new Date(viewingCustomer.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {onSelectCustomerForAccounts && (
                <button
                  className="secondary-button"
                  onClick={() => {
                    const id = viewingCustomer.id;
                    setViewingCustomer(null);
                    onSelectCustomerForAccounts(id);
                  }}
                >
                  View Accounts →
                </button>
              )}
              {onSelectCustomerForConsents && (
                <button
                  className="secondary-button"
                  onClick={() => {
                    const id = viewingCustomer.id;
                    setViewingCustomer(null);
                    onSelectCustomerForConsents(id);
                  }}
                >
                  View Consents →
                </button>
              )}
              <button className="primary-button" onClick={() => setViewingCustomer(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
