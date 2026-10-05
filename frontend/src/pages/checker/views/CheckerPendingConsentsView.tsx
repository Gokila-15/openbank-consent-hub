import { useState, useMemo } from "react";
import type { Consent } from "../../../types";

interface CheckerPendingConsentsViewProps {
  consents: Consent[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onReviewConsent: (consent: Consent) => void;
}

export default function CheckerPendingConsentsView({
  consents,
  loading,
  error,
  onRefresh,
  onReviewConsent,
}: CheckerPendingConsentsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Only consider PENDING consents
  const pendingConsents = useMemo(() => {
    return consents.filter(
      (c) => c.status?.toUpperCase() === "PENDING"
    );
  }, [consents]);

  // Apply search filter
  const filteredPending = useMemo(() => {
    if (!searchTerm.trim()) return pendingConsents;
    const term = searchTerm.toLowerCase();

    return pendingConsents.filter((c) => {
      const idMatch = c.id?.toString().includes(term);
      const customerMatch =
        c.customer?.name?.toLowerCase().includes(term) ||
        c.customer?.id?.toString().includes(term) ||
        c.customer?.email?.toLowerCase().includes(term);
      const purposeMatch = c.purpose?.toLowerCase().includes(term);
      const creatorMatch = c.createdBy?.toLowerCase().includes(term);
      const dataAccessMatch = c.dataAccess?.toLowerCase().includes(term);

      return (
        idMatch ||
        customerMatch ||
        purposeMatch ||
        creatorMatch ||
        dataAccessMatch
      );
    });
  }, [pendingConsents, searchTerm]);

  if (loading) {
    return (
      <div className="view-card skeleton-container">
        <div className="skeleton-title" style={{ width: "240px" }}></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <p className="loading-text">Loading pending consents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-card error-card">
        <h3>Unable to load pending consents</h3>
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
        <div>
          <h2>Pending Consents Review Queue</h2>
          <p>Review and authorize data sharing consent requests submitted by Makers</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={onRefresh}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="view-card filter-bar-card">
        <div className="filters-grid">
          <div className="filter-group filter-search" style={{ flex: 1 }}>
            <label htmlFor="checker-search-pending">Search Pending Consents</label>
            <input
              id="checker-search-pending"
              type="text"
              placeholder="Search by Consent ID, Customer name, Purpose, or Creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <button
              className="secondary-button"
              onClick={() => setSearchTerm("")}
              style={{ alignSelf: "flex-end" }}
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* PENDING TABLE */}
      <div className="view-card">
        {filteredPending.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">⏳</div>
            <h3>
              {pendingConsents.length === 0
                ? "No pending consent requests."
                : "No matching pending consents found."}
            </h3>
            <p>
              {pendingConsents.length === 0
                ? "All submitted consent requests have been reviewed and decided. New requests created by Makers will appear here."
                : "Try adjusting your search criteria to find specific consent requests."}
            </p>
            {pendingConsents.length > 0 && searchTerm && (
              <button
                className="secondary-button"
                onClick={() => setSearchTerm("")}
                style={{ marginTop: "16px" }}
              >
                Clear Search Filter
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
                  <th>Created At</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPending.map((c) => (
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
                    <td>
                      <span className="font-semibold text-main">{c.purpose}</span>
                    </td>
                    <td>
                      <span className="data-scope-pill">{c.dataAccess}</span>
                    </td>
                    <td>
                      <span className="font-mono text-muted-small font-semibold">
                        {c.createdBy || "Maker"}
                      </span>
                    </td>
                    <td className="text-muted-small font-mono">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "N/A"}
                    </td>
                    <td>
                      <span className="status-pill status-pending">⏳ PENDING</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="table-action-btn primary-action-btn"
                        onClick={() => onReviewConsent(c)}
                        title="Review details, approve or reject"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
