import { useState, useMemo } from "react";
import type { Consent, Customer, CreateConsentRequest } from "../../../types";
import { consentService } from "../../../services/consentService";

interface AdminConsentsViewProps {
  consents: Consent[];
  customers?: Customer[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onConsentsUpdated?: () => void;
  onReviewConsent: (consent: Consent) => void;
}

type AdminConsentFilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export default function AdminConsentsView({
  consents,
  customers = [],
  loading,
  error,
  onRefresh,
  onConsentsUpdated,
  onReviewConsent,
}: AdminConsentsViewProps) {
  const [statusFilter, setStatusFilter] = useState<AdminConsentFilterStatus>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states for Create Consent
  const [createForm, setCreateForm] = useState<CreateConsentRequest>({
    customerId: customers[0]?.id || 1,
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
      customerId: customers[0]?.id || (consents[0]?.customer?.id ?? 1),
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

    if (!createForm.customerId) {
      setFormError("Target customer is required.");
      return;
    }
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
      setActionSuccess("Consent request created successfully! Status is PENDING for Checker review.");
      setIsCreateOpen(false);
      onConsentsUpdated ? onConsentsUpdated() : onRefresh();
    } catch (err: any) {
      console.error("Failed to create consent:", err);
      let msg = "Failed to create consent request. Please verify fields and try again.";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredConsents = useMemo(() => {
    return consents.filter((c) => {
      const status = c.status?.toUpperCase();

      // Status filter
      if (statusFilter !== "ALL" && status !== statusFilter) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const idMatch = c.id?.toString().includes(term);
        const customerMatch =
          c.customer?.name?.toLowerCase().includes(term) ||
          c.customer?.id?.toString().includes(term) ||
          c.customer?.email?.toLowerCase().includes(term);
        const purposeMatch = c.purpose?.toLowerCase().includes(term);
        const creatorMatch = c.createdBy?.toLowerCase().includes(term);
        const reviewerMatch =
          c.approvedBy?.toLowerCase().includes(term) ||
          c.rejectedBy?.toLowerCase().includes(term);
        const dataAccessMatch = c.dataAccess?.toLowerCase().includes(term);

        if (
          !idMatch &&
          !customerMatch &&
          !purposeMatch &&
          !creatorMatch &&
          !reviewerMatch &&
          !dataAccessMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [consents, statusFilter, searchTerm]);

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
        <div className="skeleton-title" style={{ width: "240px" }}></div>
        <div className="skeleton-line"></div>
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
        <button className="primary-button" onClick={onRefresh} style={{ marginTop: "12px" }}>
          Retry
        </button>
      </div>
    );
  }

  const pendingCount = consents.filter((c) => c.status?.toUpperCase() === "PENDING").length;
  const approvedCount = consents.filter((c) => c.status?.toUpperCase() === "APPROVED").length;
  const rejectedCount = consents.filter((c) => c.status?.toUpperCase() === "REJECTED").length;

  return (
    <div className="view-container">
      {/* SECTION HEADER */}
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
        <div className="alert-box success-alert" style={{ marginBottom: "16px" }}>
          <span>✓ {actionSuccess}</span>
          <button className="alert-close" onClick={() => setActionSuccess(null)}>×</button>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="view-card filter-bar-card">
        <div className="filters-grid">
          <div className="filter-group filter-search" style={{ flex: 1, minWidth: "260px" }}>
            <label htmlFor="admin-search-consents">Search Consents</label>
            <input
              id="admin-search-consents"
              type="text"
              placeholder="Search by Consent ID, Customer name, Purpose, or Creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group" style={{ minWidth: "180px" }}>
            <label htmlFor="admin-filter-consent-status">Filter by Status</label>
            <select
              id="admin-filter-consent-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AdminConsentFilterStatus)}
            >
              <option value="ALL">All Statuses ({consents.length})</option>
              <option value="PENDING">Pending Only ({pendingCount})</option>
              <option value="APPROVED">Approved Only ({approvedCount})</option>
              <option value="REJECTED">Rejected Only ({rejectedCount})</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== "ALL") && (
            <button
              className="secondary-button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
              }}
              style={{ alignSelf: "flex-end" }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* CONSENTS TABLE */}
      <div className="view-card">
        {filteredConsents.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">🔐</div>
            <h3>
              {consents.length === 0
                ? "No consent requests found."
                : statusFilter === "PENDING"
                ? "No pending consent requests."
                : "No matching consent requests found."}
            </h3>
            <p>
              {consents.length === 0
                ? "No third-party data sharing requests have been created yet."
                : "Try adjusting your search criteria or status filter."}
            </p>
            <button
              className="primary-button"
              onClick={openCreateModal}
              style={{ marginTop: "16px" }}
            >
              + Create First Consent
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Consent ID</th>
                  <th>Customer</th>
                  <th>Purpose</th>
                  <th>Data Access</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created At</th>
                  <th>Reviewed By</th>
                  <th>Reviewed At</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsents.map((c) => {
                  const isPending = c.status?.toUpperCase() === "PENDING";
                  const reviewer = c.approvedBy || c.rejectedBy || (isPending ? "Awaiting Decision" : "System");
                  const reviewedDate = c.approvedAt || c.rejectedAt || (isPending ? null : c.updatedAt);

                  return (
                    <tr key={c.id}>
                      <td className="font-mono font-semibold">{c.id}</td>
                      <td>
                        <div className="customer-cell">
                          <span className="font-semibold text-main">
                            {c.customer?.name || `Customer ${c.customer?.id || "N/A"}`}
                          </span>
                          {c.customer?.email && (
                            <span className="text-muted-small font-mono">
                              {c.customer.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="font-semibold text-main">{c.purpose}</td>
                      <td>
                        <span className="data-scope-pill">{c.dataAccess}</span>
                      </td>
                      <td>{renderStatusBadge(c.status)}</td>
                      <td className="font-mono text-muted-small">{c.createdBy || "Maker"}</td>
                      <td className="text-muted-small font-mono">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td>
                        <span className={`font-mono text-muted-small ${isPending ? "text-muted-small" : "font-semibold text-main"}`}>
                          {reviewer}
                        </span>
                      </td>
                      <td className="text-muted-small font-mono">
                        {reviewedDate
                          ? new Date(reviewedDate).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className={`table-action-btn ${isPending ? "primary-action-btn" : ""}`}
                          onClick={() => onReviewConsent(c)}
                        >
                          {isPending ? "Review" : "Details"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
                  <div className="alert-box error-alert" style={{ marginBottom: "14px" }}>
                    <span>⚠️ {formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="admin-create-consent-cust">Target Customer *</label>
                  {customers && customers.length > 0 ? (
                    <select
                      id="admin-create-consent-cust"
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
                  ) : (
                    <input
                      id="admin-create-consent-cust"
                      type="number"
                      value={createForm.customerId || ""}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          customerId: Number(e.target.value),
                        })
                      }
                      placeholder="Enter Customer ID"
                      required
                    />
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="admin-consent-purpose">Purpose *</label>
                  <input
                    id="admin-consent-purpose"
                    type="text"
                    value={createForm.purpose}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, purpose: e.target.value })
                    }
                    placeholder="e.g. Loan Application Verification, Wealth Advisory"
                    required
                  />
                 
                </div>

                <div className="form-group">
                  <label htmlFor="admin-consent-data-access">Data Access Scope *</label>
                  <select
                    id="admin-consent-data-access"
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
                  <label htmlFor="admin-consent-expiry">Expiry Date & Time (Future)</label>
                  <input
                    id="admin-consent-expiry"
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
    </div>
  );
}
