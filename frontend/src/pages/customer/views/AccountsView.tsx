import { useState } from "react";
import type { Account } from "../../../types";

interface AccountsViewProps {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelectAccountForTransactions?: (accountId: number) => void;
}

export default function AccountsView({
  accounts,
  loading,
  error,
  onRefresh,
  onSelectAccountForTransactions,
}: AccountsViewProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.balance ? Number(acc.balance) : 0),
    0
  );

  const activeAccountsCount = accounts.filter(
    (a) => a.status === "ACTIVE"
  ).length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="view-card skeleton-container">
        <div className="skeleton-title"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <p className="loading-text">Loading your accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-card error-card">
        <h3>Unable to load accounts</h3>
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
          <h2>My Accounts</h2>
          <p>Real-time view of your OpenBank savings, checking, and deposit accounts</p>
        </div>
        <button className="secondary-button" onClick={onRefresh}>
          🔄 Refresh
        </button>
      </div>

      {/* OVERVIEW STATS */}
      <div className="summary-grid">
        <div className="summary-card">
          <p>Total Accounts</p>
          <h2>{accounts.length}</h2>
          <span>{activeAccountsCount} Active / {accounts.length - activeAccountsCount} Inactive</span>
        </div>
        <div className="summary-card">
          <p>Cumulative Balance</p>
          <h2>{formatCurrency(totalBalance)}</h2>
          <span>Across all accounts</span>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="view-card empty-state-card">
          <div className="empty-icon">🏦</div>
          <h3>No Accounts Found</h3>
          <p>You currently do not have any linked bank accounts. Please contact bank administration if this is unexpected.</p>
        </div>
      ) : (
        <div className="accounts-cards-grid">
          {accounts.map((acc) => (
            <div key={acc.id} className="account-card-modern">
              <div className="account-card-top">
                <span className="account-type-badge">
                  {acc.accountType || "SAVINGS"} ACCOUNT
                </span>
                <span className={`status-pill ${acc.status?.toLowerCase() === "active" ? "status-active" : "status-closed"}`}>
                  {acc.status}
                </span>
              </div>

              <div className="account-balance-section">
                <span className="balance-label">Available Balance</span>
                <h3 className="balance-amount">{formatCurrency(Number(acc.balance))}</h3>
              </div>

              <div className="account-number-section">
                <span className="account-num-label">Account Number</span>
                <span className="account-num-val font-mono">{acc.accountNumber}</span>
              </div>

              <div className="account-meta">
                <span>Opened: {new Date(acc.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}</span>
              </div>

              <div className="account-actions-row">
                <button
                  className="card-secondary-btn"
                  onClick={() => setSelectedAccount(acc)}
                >
                  View Details
                </button>
                {onSelectAccountForTransactions && (
                  <button
                    className="card-primary-btn"
                    onClick={() => onSelectAccountForTransactions(acc.id)}
                  >
                    Transactions →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ACCOUNT DETAILS MODAL */}
      {selectedAccount && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Account Details</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedAccount(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="detail-label">Account ID</span>
                <span className="detail-value font-mono">#{selectedAccount.id}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Account Number</span>
                <span className="detail-value font-mono">{selectedAccount.accountNumber}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Account Type</span>
                <span className="detail-value">{selectedAccount.accountType}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Current Balance</span>
                <span className="detail-value font-bold">
                  {formatCurrency(Number(selectedAccount.balance))}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Status</span>
                <span className={`status-pill ${selectedAccount.status?.toLowerCase() === "active" ? "status-active" : "status-closed"}`}>
                  {selectedAccount.status}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Created At</span>
                <span className="detail-value">
                  {new Date(selectedAccount.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              {onSelectAccountForTransactions && (
                <button
                  className="primary-button"
                  onClick={() => {
                    const id = selectedAccount.id;
                    setSelectedAccount(null);
                    onSelectAccountForTransactions(id);
                  }}
                >
                  View Account Transactions
                </button>
              )}
              <button
                className="secondary-button"
                onClick={() => setSelectedAccount(null)}
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
