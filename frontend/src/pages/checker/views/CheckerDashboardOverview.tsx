import type { Consent } from "../../../types";

interface CheckerDashboardOverviewProps {
  consents: Consent[];
  loading: boolean;
  error: string | null;
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
  onReviewConsent: (consent: Consent) => void;
}

export default function CheckerDashboardOverview({
  consents,
  loading,
  error,
  onNavigateTab,
  onRefresh,
  onReviewConsent,
}: CheckerDashboardOverviewProps) {
  const pendingConsents = consents.filter(
    (c) => c.status?.toUpperCase() === "PENDING"
  );
  const approvedConsents = consents.filter(
    (c) => c.status?.toUpperCase() === "APPROVED"
  );
  const rejectedConsents = consents.filter(
    (c) => c.status?.toUpperCase() === "REJECTED"
  );

  const pendingCount = pendingConsents.length;
  const approvedCount = approvedConsents.length;
  const rejectedCount = rejectedConsents.length;
  const totalReviewedCount = approvedCount + rejectedCount;

  return (
    <div className="view-container">
      {/* 4 SUMMARY STATS CARDS */}
      <section className="summary-grid">
        {/* PENDING CONSENTS */}
        <div
          className="summary-card checker-summary-card pending-card-highlight"
          onClick={() => onNavigateTab("pending")}
          style={{ cursor: "pointer" }}
        >
          <div className="summary-card-header">
            <p>Pending Consents</p>
            
          </div>
          <h2>{loading ? "..." : pendingCount}</h2>
          <span style={{ color: pendingCount > 0 ? "#b45309" : "#0d9488", fontWeight: 600 }}>
            {pendingCount > 0 ? "Requires Review & Decision" : "All Caught Up"}
          </span>
        </div>

        {/* APPROVED */}
        <div
          className="summary-card checker-summary-card"
          onClick={() => onNavigateTab("history")}
          style={{ cursor: "pointer" }}
        >
          <div className="summary-card-header">
            <p>Approved</p>
         
          </div>
          <h2>{loading ? "..." : approvedCount}</h2>
          <span style={{ color: "#15803d", fontWeight: 600 }}>Active Authorizations</span>
        </div>

        {/* REJECTED */}
        <div
          className="summary-card checker-summary-card"
          onClick={() => onNavigateTab("history")}
          style={{ cursor: "pointer" }}
        >
          <div className="summary-card-header">
            <p>Rejected</p>
        
          </div>
          <h2>{loading ? "..." : rejectedCount}</h2>
          <span style={{ color: "#dc2626", fontWeight: 600 }}>Declined Authorizations</span>
        </div>

        {/* TOTAL REVIEWED */}
        <div
          className="summary-card checker-summary-card"
          onClick={() => onNavigateTab("history")}
          style={{ cursor: "pointer" }}
        >
          <div className="summary-card-header">
            <p>Total Reviewed</p>
          
          </div>
          <h2>{loading ? "..." : totalReviewedCount}</h2>
          <span>Approved + Rejected</span>
        </div>
      </section>

      {/* QUICK STATUS BANNER */}
      {pendingCount > 0 ? (
        <div className="checker-alert-banner warning-banner">
          <div className="banner-left">
            <span className="banner-icon"></span>
            <div>
              <strong>Pending Consent Request{pendingCount > 1 ? "s" : ""}</strong>
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => onNavigateTab("pending")}
          >
            Go to Pending Queue →
          </button>
        </div>
      ) : (
        <div className="checker-alert-banner success-banner">
          <div className="banner-left">
            <div>
              <strong>All Pending Consents Reviewed</strong>
              <p>There are no consent requests awaiting verification at this time.</p>
            </div>
          </div>
          <button
            className="secondary-button"
            onClick={onRefresh}
          >
            🔄 Check for Updates
          </button>
        </div>
      )}

      {/* OVERVIEW CONTENT GRID */}
      <div className="profile-grid">
        {/* RECENT PENDING REQUESTS PREVIEW */}
        <section className="view-card">
          <div className="section-header">
            <div>
              <h2>Pending Verification Queue</h2>
              <p>Requests requiring your authorization decision</p>
            </div>
            {pendingCount > 0 && (
              <button
                className="view-button"
                onClick={() => onNavigateTab("pending")}
              >
                View All ({pendingCount})
              </button>
            )}
          </div>

          {loading ? (
            <div className="skeleton-container">
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
              <p className="loading-text">Loading consent requests...</p>
            </div>
          ) : error ? (
            <div className="alert-box error-alert">
              <span>⚠️ {error}</span>
              <button className="primary-button" onClick={onRefresh} style={{ marginLeft: "12px", padding: "4px 10px", fontSize: "12px" }}>
                Retry
              </button>
            </div>
          ) : pendingConsents.length === 0 ? (
            <div className="empty-state-mini">
              <div className="empty-icon" style={{ fontSize: "32px" }}>✅</div>
              <h4 style={{ margin: "4px 0" }}>No pending consents</h4>
              <p className="text-muted-small">No requests are currently waiting for checker approval.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Purpose</th>
                    <th>Created By</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingConsents.slice(0, 5).map((c) => (
                    <tr key={c.id}>
                      <td className="font-mono font-semibold">#{c.id}</td>
                      <td>
                        <span className="font-semibold">
                          {c.customer?.name || `Customer #${c.customer?.id || "N/A"}`}
                        </span>
                      </td>
                      <td className="font-semibold">{c.purpose}</td>
                      <td className="font-mono text-muted-small">{c.createdBy || "Maker"}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="table-action-btn primary-action-btn"
                          onClick={() => onReviewConsent(c)}
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
        </section>
      </div>
    </div>
  );
}
