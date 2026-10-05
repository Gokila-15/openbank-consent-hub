import { useState, useEffect } from "react";
import type { Customer, Account, Beneficiary, Consent, UpdateCustomerRequest, CreateCustomerRequest } from "../../../types";
import { customerService } from "../../../services/customerService";
import { accountService } from "../../../services/accountService";
import { beneficiaryService } from "../../../services/beneficiaryService";
import { consentService } from "../../../services/consentService";

interface AdminCustomerModalProps {
  customer: Customer | null;
  mode: "view" | "edit" | "delete" | "create";
  onClose: () => void;
  onCustomerUpdated: () => void;
}

export default function AdminCustomerModal({
  customer,
  mode,
  onClose,
  onCustomerUpdated,
}: AdminCustomerModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "accounts" | "beneficiaries" | "consents">("details");

  // Edit / Create Form States
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Sub-resources for View mode
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Operation states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "create") {
      setName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setUsername("");
      setPassword("");
      setErrorMessage(null);
    } else if (customer) {
      setName(customer.name || "");
      setLastName(customer.lastName || "");
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
      setUsername(customer.username || "");
      setErrorMessage(null);

      if (mode === "view") {
        setLoadingResources(true);
        Promise.all([
          accountService.getAccountsByCustomer(customer.id).catch(() => [] as Account[]),
          beneficiaryService.getBeneficiariesByCustomer(customer.id).catch(() => [] as Beneficiary[]),
          consentService.getConsentsByCustomer(customer.id).catch(() => [] as Consent[]),
        ])
          .then(([accs, bens, cons]) => {
            setAccounts(accs || []);
            setBeneficiaries(bens || []);
            setConsents(cons || []);
          })
          .finally(() => setLoadingResources(false));
      }
    }
  }, [customer, mode]);

  if (mode !== "create" && !customer) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !phone.trim() || !username.trim() || !password.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      const createData: CreateCustomerRequest = {
        name: name.trim(),
        lastName: lastName.trim() || "User",
        email: email.trim(),
        phone: phone.trim(),
        username: username.trim(),
        password: password,
      };
      await customerService.createCustomer(createData);
      onCustomerUpdated();
      onClose();
    } catch (err: any) {
      console.error("Failed to create customer:", err);
      let msg = "Failed to create customer record.";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.response?.status === 400) {
        msg = "Validation failed or email/username is already registered.";
      }
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Customer name is required.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Email address is required.");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("Phone number is required.");
      return;
    }

    try {
      setSubmitting(true);
      const updateData: UpdateCustomerRequest = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };
      await customerService.updateCustomer(customer.id, updateData);
      onCustomerUpdated();
      onClose();
    } catch (err: any) {
      console.error("Failed to update customer:", err);
      let msg = "Failed to update customer.";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.response?.status === 403) {
        msg = "You are not authorized to perform this action.";
      } else if (err?.response?.status === 404) {
        msg = "Customer not found.";
      } else if (err?.response?.status >= 500) {
        msg = "Unable to connect to the OpenBank server.";
      }
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!customer) return;
    setErrorMessage(null);
    try {
      setSubmitting(true);
      await customerService.deleteCustomer(customer.id);
      onCustomerUpdated();
      onClose();
    } catch (err: any) {
      console.error("Failed to delete customer:", err);
      let msg = "Failed to delete customer.";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.response?.status === 403) {
        msg = "You are not authorized to perform this action.";
      } else if (err?.response?.status === 404) {
        msg = "Customer record not found.";
      } else if (err?.response?.status >= 500) {
        msg = "Cannot delete customer because related records (accounts, transactions, or consents) exist in database.";
      } else if (!err?.response) {
        msg = "Unable to connect to the OpenBank server.";
      }
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="modal-box admin-customer-modal" style={{ maxWidth: mode === "view" ? "640px" : "520px" }}>
        {/* MODAL HEADER */}
        <div className="modal-header">
          <div>
            <h3>
              {mode === "create" && "Onboard New Customer"}
              {mode === "view" && `Customer Profile: ${customer?.name}`}
              {mode === "edit" && `Edit Customer #${customer?.id}`}
              {mode === "delete" && `Delete Customer #${customer?.id}`}
            </h3>
            <p className="modal-subtitle font-mono">
              {mode === "create" ? "Direct Client Registration" : `Reference: #${customer?.id} ${customer?.username ? `• @${customer.username}` : ""}`}
            </p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="modal-body">
          {errorMessage && (
            <div className="alert-box error-alert" style={{ marginBottom: "14px" }}>
              <span>⚠️ {errorMessage}</span>
              <button className="alert-close" onClick={() => setErrorMessage(null)}>×</button>
            </div>
          )}

          {/* CREATE MODE */}
          {mode === "create" && (
            <form id="admin-create-customer-form" onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label htmlFor="admin-create-cust-name">First Name *</label>
                  <input
                    id="admin-create-cust-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-create-cust-lname">Last Name</label>
                  <input
                    id="admin-create-cust-lname"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Kumar"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="admin-create-cust-email">Email Address *</label>
                <input
                  id="admin-create-cust-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-create-cust-phone">Phone Number *</label>
                <input
                  id="admin-create-cust-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label htmlFor="admin-create-cust-user">Username *</label>
                  <input
                    id="admin-create-cust-user"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="rameshk"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-create-cust-pass">Initial Password *</label>
                  <input
                    id="admin-create-cust-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="info-notice-box">
                <span className="notice-icon">ℹ️</span>
                <div>
                  <strong>Keycloak & DB Synchronization:</strong> Automatically provisions the customer profile in PostgreSQL and grants CUSTOMER banking permissions.
                </div>
              </div>
            </form>
          )}

          {/* VIEW MODE */}
          {mode === "view" && customer && (
            <>
              {/* SUB TABS */}
              <div className="admin-modal-nav-tabs">
                <button
                  type="button"
                  className={`modal-tab-btn ${activeTab === "details" ? "active" : ""}`}
                  onClick={() => setActiveTab("details")}
                >
                  👤 Details
                </button>
                <button
                  type="button"
                  className={`modal-tab-btn ${activeTab === "accounts" ? "active" : ""}`}
                  onClick={() => setActiveTab("accounts")}
                >
                  💳 Accounts ({accounts.length})
                </button>
                <button
                  type="button"
                  className={`modal-tab-btn ${activeTab === "beneficiaries" ? "active" : ""}`}
                  onClick={() => setActiveTab("beneficiaries")}
                >
                  📋 Payees ({beneficiaries.length})
                </button>
                <button
                  type="button"
                  className={`modal-tab-btn ${activeTab === "consents" ? "active" : ""}`}
                  onClick={() => setActiveTab("consents")}
                >
                  🔐 Consents ({consents.length})
                </button>
              </div>

              {activeTab === "details" && (
                <div className="checker-details-list">
                  <div className="modal-detail-row">
                    <span className="detail-label">Customer ID</span>
                    <span className="detail-value font-mono font-bold">#{customer.id}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="detail-label">Full Name</span>
                    <span className="detail-value font-bold text-main">{customer.name} {customer.lastName || ""}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="detail-label">Username (Keycloak)</span>
                    <span className="detail-value font-mono">{customer.username || "N/A"}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-value text-main">{customer.email}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="detail-label">Phone Number</span>
                    <span className="detail-value font-mono">{customer.phone}</span>
                  </div>
                  <div className="modal-detail-row">
                    <span className="detail-label">Registration Date</span>
                    <span className="detail-value font-mono text-muted-small">
                      {customer.createdAt
                        ? new Date(customer.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "accounts" && (
                <div>
                  {loadingResources ? (
                    <p className="loading-text">Loading accounts...</p>
                  ) : accounts.length === 0 ? (
                    <p className="text-muted-small" style={{ padding: "16px 0", textAlign: "center" }}>No accounts associated with this customer.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Account No</th>
                            <th>Type</th>
                            <th>Balance</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((a) => (
                            <tr key={a.id}>
                              <td className="font-mono font-semibold">{a.accountNumber}</td>
                              <td>{a.accountType}</td>
                              <td className="font-bold">₹{Number(a.balance || 0).toLocaleString("en-IN")}</td>
                              <td>
                                <span className={`status-pill ${a.status?.toUpperCase() === "ACTIVE" ? "status-active" : "status-closed"}`}>
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "beneficiaries" && (
                <div>
                  {loadingResources ? (
                    <p className="loading-text">Loading beneficiaries...</p>
                  ) : beneficiaries.length === 0 ? (
                    <p className="text-muted-small" style={{ padding: "16px 0", textAlign: "center" }}>No registered beneficiaries found.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Payee Name</th>
                            <th>Account No</th>
                            <th>Bank</th>
                            <th>IFSC</th>
                          </tr>
                        </thead>
                        <tbody>
                          {beneficiaries.map((b) => (
                            <tr key={b.id}>
                              <td className="font-semibold">{b.name}</td>
                              <td className="font-mono">{b.accountNumber}</td>
                              <td>{b.bankName}</td>
                              <td className="font-mono">{b.ifscCode}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "consents" && (
                <div>
                  {loadingResources ? (
                    <p className="loading-text">Loading consents...</p>
                  ) : consents.length === 0 ? (
                    <p className="text-muted-small" style={{ padding: "16px 0", textAlign: "center" }}>No data sharing consents created for this customer.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Purpose</th>
                            <th>Scope</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {consents.map((c) => (
                            <tr key={c.id}>
                              <td className="font-mono font-semibold">#{c.id}</td>
                              <td>{c.purpose}</td>
                              <td><span className="data-scope-pill">{c.dataAccess}</span></td>
                              <td>
                                <span className={`status-pill ${
                                  c.status?.toUpperCase() === "APPROVED"
                                    ? "status-active"
                                    : c.status?.toUpperCase() === "REJECTED"
                                    ? "status-closed"
                                    : "status-pending"
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* EDIT MODE */}
          {mode === "edit" && customer && (
            <form id="admin-edit-customer-form" onSubmit={handleUpdateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label htmlFor="admin-cust-name">Customer Name *</label>
                <input
                  id="admin-cust-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-cust-email">Email Address *</label>
                <input
                  id="admin-cust-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-cust-phone">Phone Number *</label>
                <input
                  id="admin-cust-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  required
                />
              </div>

              <div className="info-notice-box">
                <span className="notice-icon">ℹ️</span>
                <div>
                  <strong>Admin Maintenance:</strong> Updates customer profile metadata in PostgreSQL. Keycloak identity login remains linked to username <code>{customer.username || "N/A"}</code>.
                </div>
              </div>
            </form>
          )}

          {/* DELETE MODE */}
          {mode === "delete" && customer && (
            <div className="checker-confirm-box">
              <div className="confirm-icon">⚠️</div>
              <h4 className="confirm-title">Confirm Customer Deletion</h4>
              <p className="confirm-text">
                Are you sure you want to delete customer <strong>"{customer.name}"</strong> (ID: #{customer.id})?
                This action is permanent in the database.
              </p>
              <div className="info-notice-box" style={{ textAlign: "left", marginBottom: "16px" }}>
                <span className="notice-icon">🛡️</span>
                <div>
                  <strong>Integrity Rule:</strong> If this customer has active accounts, transactions, or consents, database integrity will reject the deletion.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={submitting}
          >
            {mode === "view" ? "Close" : "Cancel"}
          </button>

          {mode === "create" && (
            <button
              type="submit"
              form="admin-create-customer-form"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? "Onboarding..." : "Onboard Customer"}
            </button>
          )}

          {mode === "edit" && (
            <button
              type="submit"
              form="admin-edit-customer-form"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? "Saving Changes..." : "Save Customer Changes"}
            </button>
          )}

          {mode === "delete" && (
            <button
              type="button"
              className="btn-reject-confirm"
              onClick={handleDeleteSubmit}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Yes, Delete Customer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
