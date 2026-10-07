import { useState, useMemo } from "react";
import type { Consent } from "../../../types";

interface CheckerConsentHistoryViewProps {
  consents: Consent[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onViewDetails: (consent: Consent) => void;
}

type HistoryFilterStatus = "ALL" | "APPROVED" | "REJECTED";

export default function CheckerConsentHistoryView({
  consents,
  loading,
  error,
  onRefresh,
  onViewDetails,
}: CheckerConsentHistoryViewProps) {
  const [statusFilter, setStatusFilter] = useState<HistoryFilterStatus>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Only consider processed consents (APPROVED or REJECTED)
  const historyConsents = useMemo(() => {
    return consents.filter((c) => {
      const status = c.status?.toUpperCase();
      return status === "APPROVED" || status === "REJECTED";
    });
  }, [consents]);

  // Apply status filter and search filter
  const filteredHistory = useMemo(() => {
    return historyConsents.filter((c) => {
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
  }, [historyConsents, statusFilter, searchTerm]);

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
        <p className="loading-text">Loading consent history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-card error-card">
        <h3>Unable to load consent history</h3>
        <p>{error}</p>
        <button className="primary-button" onClick={onRefresh} style={{ marginTop: "12px" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="view-container">
      {/* SECTION HEADER */}
      <div className="section-header-modern">
       
        <div className="header-actions">
          <button className="secondary-button" onClick={onRefresh}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="view-card filter-bar-card">
        <div className="filters-grid">
          <div className="filter-group filter-search" style={{ flex: 1, minWidth: "260px" }}>
            <label htmlFor="checker-search-history">Search History</label>
            <input
              id="checker-search-history"
              type="text"
              placeholder="Search by Consent ID, Customer, Purpose, Maker, or Reviewer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group" style={{ minWidth: "180px" }}>
            <label htmlFor="checker-filter-history-status">Decision Status</label>
            <select
              id="checker-filter-history-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as HistoryFilterStatus)}
            >
              <option value="ALL">All Decisions ({historyConsents.length})</option>
              <option value="APPROVED">
                Approved Only ({historyConsents.filter((c) => c.status?.toUpperCase() === "APPROVED").length})
              </option>
              <option value="REJECTED">
                Rejected Only ({historyConsents.filter((c) => c.status?.toUpperCase() === "REJECTED").length})
              </option>
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

      {/* HISTORY TABLE */}
      <div className="view-card">
        {filteredHistory.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📜</div>
            <h3>
              {historyConsents.length === 0
                ? "No consent history available."
                : "No matching records found in consent history."}
            </h3>
            <p>
              {historyConsents.length === 0
                ? "No consent requests have been approved or rejected yet. Once a decision is made in the Pending queue, the audit record will be logged here."
                : "Try adjusting your search criteria or status filter to locate past decisions."}
            </p>
            {historyConsents.length > 0 && (searchTerm || statusFilter !== "ALL") && (
              <button
                className="secondary-button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                }}
                style={{ marginTop: "16px" }}
              >
                Reset All Filters
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
                  <th>Data Access</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th>Reviewed By</th>
                  <th>Reviewed At</th>
                  <th style={{ textAlign: "center" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((c) => {
                  const reviewer = c.approvedBy || c.rejectedBy || "Checker";
                  const reviewedDate = c.approvedAt || c.rejectedAt || c.updatedAt;

                  return (
                    <tr key={c.id}>
                      <td className="font-mono font-semibold">#{c.id}</td>
                      <td>
                        <div className="customer-cell">
                          <span className="font-semibold text-main">
                            {c.customer?.name || `Customer #${c.customer?.id || "N/A"}`}
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
                      <td className="font-mono text-muted-small">{c.createdBy || "Maker"}</td>
                      <td>{renderStatusBadge(c.status)}</td>
                      <td>
                        <span className="font-mono font-semibold text-main">
                          {reviewer}
                        </span>
                      </td>
                      <td className="text-muted-small font-mono">
                        {reviewedDate
                          ? new Date(reviewedDate).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "N/A"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="table-action-btn"
                          onClick={() => onViewDetails(c)}
                          title="View complete audit record"
                        >
                          Details
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
    </div>
  );
}
