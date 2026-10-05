import type { Customer, Account, Beneficiary, Consent } from "../../../types";

interface MakerDashboardOverviewProps {
  customers: Customer[];
  accounts: Account[];
  beneficiaries: Beneficiary[];
  consents: Consent[];
  loadingCustomers: boolean;
  loadingAccounts: boolean;
  loadingBeneficiaries: boolean;
  loadingConsents: boolean;
  onNavigateTab: (tab: string) => void;
  onRefreshAll: () => void;
}

export default function MakerDashboardOverview({
  customers,
  accounts,
  beneficiaries,
  consents,
  loadingCustomers,
  loadingAccounts,
  loadingBeneficiaries,
  loadingConsents,
  onNavigateTab,
  onRefreshAll,
}: MakerDashboardOverviewProps) {
  const pendingConsentsCount = consents.filter(
    (c) => c.status?.toUpperCase() === "PENDING"
  ).length;

  const activeAccountsCount = accounts.filter(
    (a) => a.status?.toUpperCase() === "ACTIVE"
  ).length;

  const activeBeneficiariesCount = beneficiaries.filter(
    (b) => b.status?.toUpperCase() === "ACTIVE"
  ).length;

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
      {/* OPERATIONAL SUMMARY STATS */}
      <section className="summary-grid">
        <div
          className="summary-card"
          onClick={() => onNavigateTab("customers")}
          style={{ cursor: "pointer" }}
        >
          <p>Total Customers</p>
          <h2>{loadingCustomers ? "..." : customers.length}</h2>
          <span>Registered in PostgreSQL</span>
        </div>

        <div
          className="summary-card"
          onClick={() => onNavigateTab("accounts")}
          style={{ cursor: "pointer" }}
        >
          <p>Total Accounts</p>
          <h2>{loadingAccounts ? "..." : accounts.length}</h2>
          <span>{activeAccountsCount} Active / {accounts.length - activeAccountsCount} Closed</span>
        </div>

        <div
          className="summary-card"
          onClick={() => onNavigateTab("beneficiaries")}
          style={{ cursor: "pointer" }}
        >
          <p>Beneficiaries</p>
          <h2>{loadingBeneficiaries ? "..." : beneficiaries.length}</h2>
          <span>{activeBeneficiariesCount} Active Payees</span>
        </div>

        <div
          className="summary-card"
          onClick={() => onNavigateTab("consents")}
          style={{ cursor: "pointer" }}
        >
          <p>Pending Consents</p>
          <h2>{loadingConsents ? "..." : pendingConsentsCount}</h2>
          <span style={{ color: pendingConsentsCount > 0 ? "#b45309" : "#0d9488" }}>
            Awaiting Checker Review
          </span>
        </div>
      </section>

      {/* OPERATIONS OVERVIEW */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Maker Operations Center</h2>
            <p>Initiate banking workflows, account creations, and data consent grants</p>
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
            <strong>Manage Customers</strong>
            <small>Create & update customer records</small>
          </button>

          <button
            className="action-card"
            onClick={() => onNavigateTab("accounts")}
          >
            <span>💳</span>
            <strong>Manage Accounts</strong>
            <small>Open & update savings/checking accounts</small>
          </button>

          <button
            className="action-card"
            onClick={() => onNavigateTab("beneficiaries")}
          >
            <span>📋</span>
            <strong>Beneficiaries</strong>
            <small>Register interbank transfer payees</small>
          </button>

          <button
            className="action-card"
            onClick={() => onNavigateTab("consents")}
          >
            <span>🔐</span>
            <strong>Consent Hub</strong>
            <small>Initiate customer data sharing requests</small>
          </button>
        </div>
      </section>

      {/* SYSTEM OVERVIEW & RECENT CUSTOMERS PREVIEW */}
      <div className="profile-grid">
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
              View All
            </button>
          </div>

          {loadingCustomers ? (
            <p className="loading-text">Loading customer records...</p>
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
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 5).map((cust) => (
                    <tr key={cust.id}>
                      <td className="font-mono font-semibold">#{cust.id}</td>
                      <td className="font-semibold">{cust.name}</td>
                      <td className="text-muted-small">{cust.email}</td>
                      <td className="font-mono">{cust.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="view-card security-overview-card">
          <h3>Maker Role Responsibilities</h3>
          <p className="subtext">
            Operational boundaries defined by OpenBank Four-Eyes Security Policy.
          </p>

          <div className="security-badges">
            <div className="security-item">
              <div className="security-icon">✍️</div>
              <div>
                <strong>Maker Authority</strong>
                <p>Authorized to create customers, open accounts, and create consent requests.</p>
              </div>
            </div>
            <div className="security-item">
              <div className="security-icon">⚖️</div>
              <div>
                <strong>Four-Eyes Verification</strong>
                <p>Consents created by Makers require independent CHECKER or ADMIN approval.</p>
              </div>
            </div>
            <div className="security-item">
              <div className="security-icon">💰</div>
              <div>
                <strong>Managed Balance Volume</strong>
                <p>{formatCurrency(totalBalance)} total funds active in accounts.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
