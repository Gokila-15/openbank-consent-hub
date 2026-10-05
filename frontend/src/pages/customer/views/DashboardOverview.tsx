import type { Customer, Account, Transaction, Consent } from "../../../types";

interface DashboardOverviewProps {
  customer: Customer | null;
  accounts: Account[];
  transactions: Transaction[];
  consents: Consent[];
  loadingCustomer: boolean;
  loadingAccounts: boolean;
  loadingTransactions: boolean;
  loadingConsents: boolean;
  onNavigateTab: (tab: string) => void;
}

export default function DashboardOverview({
  customer,
  accounts,
  transactions,
  consents,
  loadingCustomer,
  loadingAccounts,
  loadingTransactions,
  loadingConsents,
  onNavigateTab,
}: DashboardOverviewProps) {
  // Compute dynamic stats
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.balance ? Number(acc.balance) : 0),
    0
  );

  const activeConsentsCount = consents.filter(
    (c) => c.status?.toUpperCase() === "APPROVED"
  ).length;

  const pendingConsentsCount = consents.filter(
    (c) => c.status?.toUpperCase() === "PENDING"
  ).length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Get recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="view-container">
      {/* CUSTOMER PROFILE SUMMARY */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Customer Profile</h2>
            <p>Your registered account information</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => onNavigateTab("profile")}
          >
            View Full Profile →
          </button>
        </div>

        {loadingCustomer ? (
          <p className="loading-text">Loading customer information...</p>
        ) : customer ? (
          <div className="profile-card">
            <p>
              <strong>ID:</strong> {customer.id}
            </p>
            <p>
              <strong>Name:</strong> {customer.name}
            </p>
            <p>
              <strong>Email:</strong> {customer.email}
            </p>
            <p>
              <strong>Phone:</strong> {customer.phone}
            </p>
            <p>
              <strong>Username:</strong> {customer.username || "N/A"}
            </p>
          </div>
        ) : (
          <p className="text-danger">Unable to load customer information.</p>
        )}
      </section>

      {/* DYNAMIC SUMMARY CARDS */}
      <section className="summary-grid">
        <div className="summary-card" onClick={() => onNavigateTab("accounts")} style={{ cursor: "pointer" }}>
          <p>Total Accounts</p>
          <h2>{loadingAccounts ? "..." : accounts.length}</h2>
          <span>{accounts.filter((a) => a.status === "ACTIVE").length} Active Accounts</span>
        </div>

        <div className="summary-card" onClick={() => onNavigateTab("accounts")} style={{ cursor: "pointer" }}>
          <p>Available Balance</p>
          <h2>{loadingAccounts ? "..." : formatCurrency(totalBalance)}</h2>
          <span>Across all accounts</span>
        </div>

        <div className="summary-card" onClick={() => onNavigateTab("consents")} style={{ cursor: "pointer" }}>
          <p>Active Consents</p>
          <h2>{loadingConsents ? "..." : activeConsentsCount}</h2>
          <span>Currently active</span>
        </div>

        <div className="summary-card" onClick={() => onNavigateTab("consents")} style={{ cursor: "pointer" }}>
          <p>Pending Consents</p>
          <h2>{loadingConsents ? "..." : pendingConsentsCount}</h2>
          <span>Awaiting approval</span>
        </div>
      </section>

      {/* RECENT TRANSACTIONS */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Recent Transactions</h2>
            <p>Your latest account activity</p>
          </div>
          <button
            className="view-button"
            onClick={() => onNavigateTab("transactions")}
          >
            View All
          </button>
        </div>

        {loadingTransactions ? (
          <p className="loading-text">Loading recent transactions...</p>
        ) : recentTransactions.length === 0 ? (
          <div className="empty-state-mini">
            <p>No recent transactions found.</p>
          </div>
        ) : (
          <div className="transaction-table">
            <div className="table-header">
              <span>Description</span>
              <span>Amount</span>
              <span>Date</span>
              <span style={{ textAlign: "right" }}>Type</span>
            </div>

            {recentTransactions.map((tx) => {
              const isDeposit = tx.type?.toUpperCase() === "DEPOSIT";
              return (
                <div key={tx.id} className="table-row">
                  <div>
                    <span className="tx-desc font-semibold">{tx.description || "N/A"}</span>
                    <small className="tx-sub font-mono">Acc: {tx.account?.accountNumber || "N/A"}</small>
                  </div>

                  <span className={isDeposit ? "credit" : "debit"}>
                    {isDeposit ? "+" : "-"}
                    {formatCurrency(Number(tx.amount))}
                  </span>

                  <span className="font-mono text-muted-small">
                    {tx.transactionDate
                      ? new Date(tx.transactionDate).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </span>

                  <div style={{ textAlign: "right" }}>
                    <span
                      className={`status ${
                        isDeposit ? "approved" : "pending"
                      }`}
                    >
                      {isDeposit ? "Deposit" : "Withdrawal"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* QUICK ACTIONS */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Quick Actions</h2>
            <p>Manage your OpenBank services</p>
          </div>
        </div>

        <div className="quick-actions">
          <button
            className="action-card"
            onClick={() => onNavigateTab("accounts")}
          >
            <span>💳</span>
            <strong>My Accounts</strong>
            <small>View your accounts</small>
          </button>

          <button
            className="action-card"
            onClick={() => onNavigateTab("transactions")}
          >
            <span>📊</span>
            <strong>Transactions</strong>
            <small>View transaction history</small>
          </button>

          <button
            className="action-card"
            onClick={() => onNavigateTab("beneficiaries")}
          >
            <span>👥</span>
            <strong>Beneficiaries</strong>
            <small>Manage beneficiaries</small>
          </button>

          <button
            className="action-card"
            onClick={() => onNavigateTab("consents")}
          >
            <span>🔐</span>
            <strong>Consents</strong>
            <small>Manage data access</small>
          </button>
        </div>
      </section>
    </div>
  );
}
