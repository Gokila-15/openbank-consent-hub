import { useState } from "react";
import type { Consent, CreateConsentRequest } from "../../../types";
import { consentService } from "../../../services/consentService";

interface ConsentsViewProps {
  consents: Consent[];
  customerId: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onConsentsUpdated: () => void;
}

export default function ConsentsView({
  consents,
  customerId,
  loading,
  error,
  onRefresh,
  onConsentsUpdated,
}: ConsentsViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");

  // Form states for Create Consent
  const [createForm, setCreateForm] = useState<CreateConsentRequest>({
    customerId,
    purpose: "",
    dataAccess: "ACCOUNT_DETAILS,TRANSACTION_HISTORY",
    expiresAt: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const openCreateModal = () => {
    // Default expiry 30 days in future formatted for datetime-local input
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const isoString = defaultDate.toISOString().slice(0, 16);

    setCreateForm({
      customerId,
      purpose: "",
      dataAccess: "ACCOUNT_DETAILS,TRANSACTION_HISTORY",
      expiresAt: isoString,
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!createForm.purpose.trim()) {
      setFormError("Purpose is required.");
      return;
    }
    if (!createForm.dataAccess.trim()) {
      setFormError("Data access scope is required.");
      return;
    }

    // Validate future expiry
    if (createForm.expiresAt) {
      const expDate = new Date(createForm.expiresAt);
      if (expDate <= new Date()) {
        setFormError("Expiry date must be in the future.");
        return;
      }
    }

    try {
      setSubmitting(true);
      await consentService.createConsent({
        ...createForm,
        customerId,
        // Convert to ISO string or null if empty
        expiresAt: createForm.expiresAt ? new Date(createForm.expiresAt).toISOString() : undefined,
      });
      setActionSuccess("Consent request submitted successfully! Status is PENDING verification.");
      setIsCreateOpen(false);
      onConsentsUpdated();
    } catch (err: unknown) {
      console.error("Failed to create consent:", err);
      setFormError("Failed to submit consent request. Please verify fields and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredConsents = consents.filter((c) => {
    if (statusFilter === "ALL") return true;
    return c.status?.toUpperCase() === statusFilter;
  });

  const renderStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || "PENDING";
    if (s === "APPROVED") {
      return <span className="status-pill status-active">✓ APPROVED</span>;
    }
    if (s === "REJECTED") {
      return <span className="status-pill status-closed">✕ REJECTED</span>;
    }
    return <span className="status-pill status-pending">⏳ PENDING</span>;
  };

  if (loading) {
    return (
      <div className="view-card skeleton-container">
        <div className="skeleton-title"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <p className="loading-text">Loading consents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-card error-card">
        <h3>Unable to load consents</h3>
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
        <div>
          <h2>Consent Hub</h2>
          <p>
            Control third-party open banking data access and permissions
          </p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={onRefresh}>
            🔄 Refresh
          </button>
          <button className="primary-button" onClick={openCreateModal}>
            + Grant New Consent
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert-box success-alert">
          <span>✓ {actionSuccess}</span>
          <button className="alert-close" onClick={() => setActionSuccess(null)}>×</button>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="view-card filter-bar-card">
        <div className="filter-group" style={{ maxWidth: "300px" }}>
          <label htmlFor="consent-status-filter">Filter by Status</label>
          <select
            id="consent-status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "ALL" | "PENDING" | "APPROVED" | "REJECTED"
              )
            }
          >
            <option value="ALL">All Consents ({consents.length})</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved / Active</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* CONSENTS LIST */}
      <div className="view-card">
        {filteredConsents.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">🔐</div>
            <h3>No Consents Found</h3>
            <p>
              {consents.length === 0
                ? "You have not authorized or created any data sharing consents yet."
                : "No consents match the selected filter."}
            </p>
            {consents.length === 0 && (
              <button
                className="primary-button"
                onClick={openCreateModal}
                style={{ marginTop: "12px" }}
              >
                + Create First Consent
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Consent ID</th>
                  <th>Purpose</th>
                  <th>Data Access Scope</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Expiry Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsents.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono font-semibold">#{c.id}</td>
                    <td className="font-semibold">{c.purpose}</td>
                    <td>
                      <span className="data-scope-pill">{c.dataAccess}</span>
                    </td>
                    <td>{renderStatusBadge(c.status)}</td>
                    <td className="text-muted-small font-mono">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td className="text-muted-small font-mono">
                      {c.expiresAt
                        ? new Date(c.expiresAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "No Expiry"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="table-action-btn"
                        onClick={() => setSelectedConsent(c)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE CONSENT MODAL */}
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Create New Consent Request</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box error-alert" style={{ marginBottom: "14px" }}>
                    <span>⚠️ {formError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="consent-purpose">Purpose *</label>
                  <input
                    id="consent-purpose"
                    type="text"
                    value={createForm.purpose}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, purpose: e.target.value })
                    }
                    placeholder="e.g. Loan Application Verification, Wealth Advisory"
                    required
                  />
                  <small className="form-help">Describe why you are authorizing data access</small>
                </div>

                <div className="form-group">
                  <label htmlFor="consent-data-access">Data Access Permissions *</label>
                  <select
                    id="consent-data-access"
                    value={createForm.dataAccess}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, dataAccess: e.target.value })
                    }
                  >
                    <option value="ACCOUNT_DETAILS,TRANSACTION_HISTORY">
                      Full Access (Account Details & Transaction History)
                    </option>
                    <option value="ACCOUNT_DETAILS">Account Details Only</option>
                    <option value="TRANSACTION_HISTORY">Transaction History Only</option>
                    <option value="BALANCE_INQUIRY">Balance Inquiry Only</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="consent-expiry">Expiry Date & Time (Future)</label>
                  <input
                    id="consent-expiry"
                    type="datetime-local"
                    value={createForm.expiresAt}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, expiresAt: e.target.value })
                    }
                  />
                  <small className="form-help">Leave empty for open-ended or pick future date</small>
                </div>

                <div className="info-notice-box">
                  <span className="notice-icon">ℹ️</span>
                  <div>
                    <strong>Verification Policy:</strong> New consents are created with <strong>PENDING</strong> status. OpenBank compliance checkers will review and approve within 24 hours.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Consent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONSENT DETAILS MODAL */}
      {selectedConsent && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Consent Details</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedConsent(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="detail-label">Consent ID</span>
                <span className="detail-value font-mono">#{selectedConsent.id}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value">{renderStatusBadge(selectedConsent.status)}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Purpose</span>
                <span className="detail-value font-bold">{selectedConsent.purpose}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Data Access Scope</span>
                <span className="detail-value data-scope-pill">{selectedConsent.dataAccess}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Created By</span>
                <span className="detail-value">{selectedConsent.createdBy || "System"}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Created At</span>
                <span className="detail-value">
                  {selectedConsent.createdAt
                    ? new Date(selectedConsent.createdAt).toLocaleString("en-IN")
                    : "N/A"}
                </span>
              </div>
              {selectedConsent.updatedAt && (
                <div className="modal-detail-row">
                  <span className="detail-label">Last Updated</span>
                  <span className="detail-value">
                    {new Date(selectedConsent.updatedAt).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {selectedConsent.approvedBy && (
                <div className="modal-detail-row">
                  <span className="detail-label">Approved By (Checker)</span>
                  <span className="detail-value font-semibold text-success">
                    {selectedConsent.approvedBy} (
                    {selectedConsent.approvedAt
                      ? new Date(selectedConsent.approvedAt).toLocaleString("en-IN")
                      : ""}
                    )
                  </span>
                </div>
              )}
              {selectedConsent.rejectedBy && (
                <div className="modal-detail-row">
                  <span className="detail-label">Rejected By</span>
                  <span className="detail-value font-semibold text-danger">
                    {selectedConsent.rejectedBy} (
                    {selectedConsent.rejectedAt
                      ? new Date(selectedConsent.rejectedAt).toLocaleString("en-IN")
                      : ""}
                    )
                  </span>
                </div>
              )}
              <div className="modal-detail-row">
                <span className="detail-label">Expires At</span>
                <span className="detail-value font-mono">
                  {selectedConsent.expiresAt
                    ? new Date(selectedConsent.expiresAt).toLocaleString("en-IN")
                    : "Never (Open-ended)"}
                </span>
              </div>

              <div className="info-notice-box" style={{ marginTop: "15px" }}>
                <span className="notice-icon">🔒</span>
                <div>
                  <strong>Role Notice:</strong> Approval and rejection actions are strictly authorized for bank CHECKER and ADMIN personnel only.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={() => setSelectedConsent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
