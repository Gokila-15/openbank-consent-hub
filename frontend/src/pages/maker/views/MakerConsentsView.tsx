import { useState, useMemo } from "react";
import type { Consent, Customer, CreateConsentRequest } from "../../../types";
import { consentService } from "../../../services/consentService";

interface MakerConsentsViewProps {
  consents: Consent[];
  customers: Customer[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onConsentsUpdated: () => void;
  selectedCustomerId?: number | "ALL";
  onSelectCustomer?: (customerId: number | "ALL") => void;
}

export default function MakerConsentsView({
  consents,
  customers,
  loading,
  error,
  onRefresh,
  onConsentsUpdated,
  selectedCustomerId = "ALL",
  onSelectCustomer,
}: MakerConsentsViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);

  // Form
  const [createForm, setCreateForm] = useState<CreateConsentRequest>({
    customerId: customers[0]?.id || 8,
    purpose: "",
    dataAccess: "ACCOUNT_DETAILS,TRANSACTION_HISTORY",
    expiresAt: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const openCreateModal = () => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const isoString = defaultDate.toISOString().slice(0, 16);

    setCreateForm({
      customerId: customers[0]?.id || 8,
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
        expiresAt: createForm.expiresAt
          ? new Date(createForm.expiresAt).toISOString()
          : undefined,
      });
      setActionSuccess("Consent request submitted with status PENDING for Checker review!");
      setIsCreateOpen(false);
      onConsentsUpdated();
    } catch (err: unknown) {
      console.error("Failed to submit consent:", err);
      setFormError("Failed to create consent request. Please verify customer selection.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredConsents = useMemo(() => {
    return consents.filter((c) => {
      // Customer filter
      if (
        selectedCustomerId &&
        selectedCustomerId !== "ALL" &&
        c.customer?.id !== selectedCustomerId
      ) {
        return false;
      }
      // Status filter
      if (statusFilter !== "ALL" && c.status?.toUpperCase() !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [consents, selectedCustomerId, statusFilter]);

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
        <p className="loading-text">Loading consent requests...</p>
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
       
        <div className="header-actions">
          <button className="secondary-button" onClick={onRefresh}>
            🔄 Refresh
          </button>
          <button className="primary-button" onClick={openCreateModal}>
            + Create Consent Request
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
        <div className="filters-grid">
          {onSelectCustomer && (
            <div className="filter-group">
              <label htmlFor="maker-consent-cust">Customer</label>
              <select
                id="maker-consent-cust"
                value={selectedCustomerId}
                onChange={(e) =>
                  onSelectCustomer(
                    e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                  )
                }
              >
                <option value="ALL">All Customers ({customers.length})</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label htmlFor="maker-consent-status">Status</label>
            <select
              id="maker-consent-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses ({consents.length})</option>
              <option value="PENDING">PENDING (Awaiting Review)</option>
              <option value="APPROVED">APPROVED (Active)</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
      </div>

      {/* CONSENTS TABLE */}
      <div className="view-card">
        {filteredConsents.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">🔐</div>
            <h3>No Consents Found</h3>
            <p>
              {consents.length === 0
                ? "No data sharing consents have been created yet."
                : "No consents matched the selected customer or status filter."}
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
                  <th>Customer</th>
                  <th>Purpose</th>
                  <th>Data Access Scope</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsents.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono font-semibold">#{c.id}</td>
                    <td>
                      <span className="font-semibold">
                        {c.customer?.name || `Customer #${c.customer?.id || "N/A"}`}
                      </span>
                    </td>
                    <td className="font-semibold">{c.purpose}</td>
                    <td>
                      <span className="data-scope-pill">{c.dataAccess}</span>
                    </td>
                    <td>{renderStatusBadge(c.status)}</td>
                    <td className="font-mono text-muted-small">{c.createdBy || "System"}</td>
                    <td className="text-muted-small font-mono">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
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
              <h3>Create Consent Request</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
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
                  <label htmlFor="maker-create-consent-cust">Target Customer *</label>
                  <select
                    id="maker-create-consent-cust"
                    value={createForm.customerId}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        customerId: Number(e.target.value),
                      })
                    }
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        #{c.id} - {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="maker-consent-purpose">Purpose *</label>
                  <input
                    id="maker-consent-purpose"
                    type="text"
                    value={createForm.purpose}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, purpose: e.target.value })
                    }
                    placeholder="e.g. Account Aggregator Verification, Loan Assessment"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="maker-consent-data-access">Data Access Scope *</label>
                  <select
                    id="maker-consent-data-access"
                    value={createForm.dataAccess}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, dataAccess: e.target.value })
                    }
                  >
                    <option value="ACCOUNT_DETAILS,TRANSACTION_HISTORY">
                      Full Access (Account Details & Transactions)
                    </option>
                    <option value="ACCOUNT_DETAILS">Account Details Only</option>
                    <option value="TRANSACTION_HISTORY">Transaction History Only</option>
                    <option value="BALANCE_INQUIRY">Balance Inquiry Only</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="maker-consent-expires">Expiry Date & Time (Future)</label>
                  <input
                    id="maker-consent-expires"
                    type="datetime-local"
                    value={createForm.expiresAt}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, expiresAt: e.target.value })
                    }
                  />
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
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Consent Request"}
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
              <h3>Consent Record #{selectedConsent.id}</h3>
              <button className="modal-close" onClick={() => setSelectedConsent(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="detail-label">Consent ID</span>
                <span className="detail-value font-mono">#{selectedConsent.id}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Customer</span>
                <span className="detail-value font-semibold">
                  {selectedConsent.customer?.name || `Customer #${selectedConsent.customer?.id || "N/A"}`}
                </span>
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
                <span className="detail-value font-mono">{selectedConsent.createdBy || "System"}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Created At</span>
                <span className="detail-value">
                  {selectedConsent.createdAt
                    ? new Date(selectedConsent.createdAt).toLocaleString("en-IN")
                    : "N/A"}
                </span>
              </div>
              {selectedConsent.approvedBy && (
                <div className="modal-detail-row">
                  <span className="detail-label">Approved By (Checker)</span>
                  <span className="detail-value text-success font-semibold">
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
                  <span className="detail-value text-danger font-semibold">
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
                    : "Open-ended (No expiry)"}
                </span>
              </div>

              <div className="info-notice-box" style={{ marginTop: "12px" }}>
                <span className="notice-icon">🛡️</span>
                <div>
                  <strong>Role Separation Policy:</strong> Makers cannot approve or reject consents. Status updates require a separate CHECKER or ADMIN session.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="primary-button" onClick={() => setSelectedConsent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
