import type { Customer, Account, Transaction, Beneficiary, Consent } from "../../../types";

interface AdminDashboardOverviewProps {
  customers: Customer[];
  accounts: Account[];
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  consents: Consent[];
  loading: boolean;
  onNavigateTab: (tab: string) => void;
  onRefreshAll: () => void;
  onViewCustomer: (customer: Customer) => void;
  onViewConsent: (consent: Consent) => void;
}

export default function AdminDashboardOverview({
  customers,
  accounts,
  transactions,
  beneficiaries,
  consents,
  loading,
  onNavigateTab,
  onRefreshAll,
  onViewCustomer,
  onViewConsent,
}: AdminDashboardOverviewProps) {
  const pendingConsents = consents.filter(
    (c) => c.status?.toUpperCase() === "PENDING"
  );
  const approvedConsents = consents.filter(
    (c) => c.status?.toUpperCase() === "APPROVED"
  );
  const rejectedConsents = consents.filter(
    (c) => c.status?.toUpperCase() === "REJECTED"
  );

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.balance ? Number(acc.balance) : 0),
    0
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="view-container">
      {/* 8 SUMMARY STATS CARDS */}
      <section className="admin-summary-grid">
        {/* TOTAL CUSTOMERS */}
        <div
          className="summary-card admin-stat-card"
          onClick={() => onNavigateTab("customers")}
          style={{ cursor: "pointer" }}
        >
          <div className="summary-card-header">
            <p>Total Customers</p>
            <span className="summary-icon">👥</span>
          </div>
          <h2>{loading ? "..." : customers.length}</h2>
          <span style={{ color: "#0d9488", fontWeight: 600 }}>Active Client Profiles</span>
        </div>

        {/* TOTAL ACCOUNTS */}
        <div
          className="summary-card admin-stat-card"
          onClick={() => onNavigateTab("system")}
          style={{ cursor: "pointer" }}
        >
          <div className="summary-card-header">
            <p>Total Accounts</p>
            <span className="summary-icon">💳</span>
          </div>
          <h2>{loading ? "..." : accounts.length}</h2>
          <span>{formatCurrency(totalBalance)} total funds</span>
        </div>

        {/* TOTAL TRANSACTIONS */}
        <div
          className="summary-card admin-stat-card"
          onClick={() => onNavigateTab("system")}
          style={{ cursor: "pointer" }}
        >
          <div className="summary-card-header">
            <p>Total Transactions</p>
            <span className="summary-icon">📈</span>
          </div>
          <h2>{loading ? "..." : transactions.length}</h2>
          <span>Processed Bank Trans</span>
        </div>

        {/* TOTAL BENEFICIARIES */}
        <div
          className="summary-card admin-stat-card"
          onClick={() => onNavigateTab("system")}
          style={{ cursor: "pointer" }}
        >
          <div className="summary-card-header">
            <p>Total Beneficiaries</p>
            <span className="summary-icon">📋</span>
          </div>
          <h2>{loading ? "..." : beneficiaries.length}</h2>
          <span>Registered Payees</span>
        </div>

        {/* PENDING CONSENTS */}
        <div
          className="summary-card admin-stat-card pending-card-highlight"
          onClick={() => onNavigateTab("consents")}
          style={{ cursor: "pointer" }}
        >
          <div className="summary-card-header">
            <p>Pending Consents</p>
            <span className="summary-icon">⏳</span>
          </div>
          <h2>{loading ? "..." : pendingConsents.length}</h2>
          <span style={{ color: pendingConsents.length > 0 ? "#b45309" : "#0d9488", fontWeight: 600 }}>
            {pendingConsents.length > 0 ? "Awaiting Decision" : "All Reviewed"}
          </span>
        </div>

        {/* APPROVED CONSENTS */}
        <div
          className="summary-card admin-stat-card"
          onClick={() => onNavigateTab("consents")}
          style={{ cursor: "pointer" }}
        >
          <div className="summary-card-header">
            <p>Approved Consents</p>
            <span className="summary-icon">✓</span>
          </div>
          <h2>{loading ? "..." : approvedConsents.length}</h2>
          <span style={{ color: "#15803d", fontWeight: 600 }}>Active Authorizations</span>
        </div>

        {/* REJECTED CONSENTS */}
        <div
          className="summary-card admin-stat-card"
          onClick={() => onNavigateTab("consents")}
          style={{ cursor: "pointer" }}
        >
          <div className="summary-card-header">
            <p>Rejected Consents</p>
            <span className="summary-icon">✕</span>
          </div>
          <h2>{loading ? "..." : rejectedConsents.length}</h2>
          <span style={{ color: "#dc2626", fontWeight: 600 }}>Declined Requests</span>
        </div>

        {/* TOTAL CONSENTS */}
        <div
          className="summary-card admin-stat-card"
          onClick={() => onNavigateTab("consents")}
          style={{ cursor: "pointer" }}
        >
          <div className="summary-card-header">
            <p>Total Consents</p>
            <span className="summary-icon">🔐</span>
          </div>
          <h2>{loading ? "..." : consents.length}</h2>
          <span>All Data Grants</span>
        </div>
      </section>

      {/* ADMIN CONTROL BAR */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>OpenBank Central Administration</h2>
            <p>System-wide monitoring, customer record maintenance, and consent management oversight</p>
          </div>
          <button className="secondary-button" onClick={onRefreshAll}>
            🔄 Refresh Metrics
          </button>
        </div>

        <div className="quick-actions">
          <button
            className="action-card"
            onClick={() => onNavigateTab("customers")}
          >
            <span>👥</span>
            <strong>Customer Directory</strong>
            <small>Inspect, update, or delete customer records</small>
          </button>

          <button
            className="action-card"
            onClick={() => onNavigateTab("consents")}
          >
            <span>🔐</span>
            <strong>Consent Central</strong>
            <small>Oversee all pending, approved & rejected consents</small>
          </button>

          <button
            className="action-card"
            onClick={() => onNavigateTab("system")}
          >
            <span>⚙️</span>
            <strong>System Overview</strong>
            <small>Inspect banking metrics & IAM role allocation</small>
          </button>
        </div>
      </section>

      {/* RECENT RECORDS PREVIEWS */}
      <div className="profile-grid">
        {/* RECENT CUSTOMERS PREVIEW */}
        <section className="view-card">
          <div className="section-header">
            <div>
              <h2>Recent Customers</h2>
              <p>Latest registered banking clients</p>
            </div>
            <button
              className="view-button"
              onClick={() => onNavigateTab("customers")}
            >
              View All ({customers.length})
            </button>
          </div>

          {loading ? (
            <p className="loading-text">Loading customers...</p>
          ) : customers.length === 0 ? (
            <p className="text-muted-small">No customers registered yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 5).map((cust) => (
                    <tr key={cust.id}>
                      <td className="font-mono font-semibold">#{cust.id}</td>
                      <td className="font-semibold text-main">{cust.name}</td>
                      <td className="text-muted-small font-mono">{cust.email}</td>
                      <td className="font-mono">{cust.phone}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="table-action-btn"
                          onClick={() => onViewCustomer(cust)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* RECENT CONSENTS PREVIEW */}
        <section className="view-card">
          <div className="section-header">
            <div>
              <h2>Recent Consents</h2>
              <p>Data access authorization stream</p>
            </div>
            <button
              className="view-button"
              onClick={() => onNavigateTab("consents")}
            >
              View All ({consents.length})
            </button>
          </div>

          {loading ? (
            <p className="loading-text">Loading consents...</p>
          ) : consents.length === 0 ? (
            <p className="text-muted-small">No consent requests found.</p>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {consents.slice(0, 5).map((c) => (
                    <tr key={c.id}>
                      <td className="font-mono font-semibold">#{c.id}</td>
                      <td className="font-semibold">{c.customer?.name || `Customer #${c.customer?.id || "N/A"}`}</td>
                      <td>{c.purpose}</td>
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
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="table-action-btn"
                          onClick={() => onViewConsent(c)}
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
