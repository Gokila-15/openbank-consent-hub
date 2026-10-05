import { useState, useMemo } from "react";
import type { Transaction, Account } from "../../../types";

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  loading: boolean;
  error: string | null;
  selectedAccountId: number | "ALL";
  onSelectAccount: (accountId: number | "ALL") => void;
  onRefresh: () => void;
}

export default function TransactionsView({
  transactions,
  accounts,
  loading,
  error,
  selectedAccountId,
  onSelectAccount,
  onRefresh,
}: TransactionsViewProps) {
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DEPOSIT" | "WITHDRAWAL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Account filter
      if (selectedAccountId !== "ALL" && tx.account?.id !== selectedAccountId) {
        return false;
      }
      // Type filter
      if (typeFilter !== "ALL" && tx.type?.toUpperCase() !== typeFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const descMatch = (tx.description || "").toLowerCase().includes(term);
        const amountMatch = String(tx.amount).includes(term);
        const accMatch = (tx.account?.accountNumber || "").toLowerCase().includes(term);
        if (!descMatch && !amountMatch && !accMatch) return false;
      }
      return true;
    });
  }, [transactions, selectedAccountId, typeFilter, searchTerm]);

  if (loading) {
    return (
      <div className="view-card skeleton-container">
        <div className="skeleton-title"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <p className="loading-text">Loading transaction records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-card error-card">
        <h3>Unable to load transactions</h3>
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
          <h2>Transaction History</h2>
          <p>Real-time audit log of your deposits, withdrawals, and transfers</p>
        </div>
        <button className="secondary-button" onClick={onRefresh}>
          🔄 Refresh
        </button>
      </div>

      {/* FILTERS BAR */}
      <div className="view-card filter-bar-card">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="account-filter">Account</label>
            <select
              id="account-filter"
              value={selectedAccountId}
              onChange={(e) =>
                onSelectAccount(
                  e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                )
              }
            >
              <option value="ALL">All Accounts ({accounts.length})</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountType} - {acc.accountNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="type-filter">Type</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "ALL" | "DEPOSIT" | "WITHDRAWAL")
              }
            >
              <option value="ALL">All Transactions</option>
              <option value="DEPOSIT">Credits (Deposit)</option>
              <option value="WITHDRAWAL">Debits (Withdrawal)</option>
            </select>
          </div>

          <div className="filter-group filter-search">
            <label htmlFor="search-tx">Search</label>
            <input
              id="search-tx"
              type="text"
              placeholder="Search description, amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="view-card">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📊</div>
            <h3>No Transactions Found</h3>
            <p>
              {transactions.length === 0
                ? "No transaction activity recorded for your accounts yet."
                : "No transactions match your selected filter criteria."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Description</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ textAlign: "right" }}>Balance After</th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isDeposit = tx.type?.toUpperCase() === "DEPOSIT";
                  return (
                    <tr key={tx.id}>
                      <td className="font-mono text-muted-small">
                        {tx.transactionDate
                          ? new Date(tx.transactionDate).toLocaleString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </td>
                      <td className="font-semibold">{tx.description || "N/A"}</td>
                      <td className="font-mono text-muted-small">
                        {tx.account?.accountNumber || "N/A"}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isDeposit ? "badge-success" : "badge-danger"
                          }`}
                        >
                          {isDeposit ? "Credit" : "Debit"}
                        </span>
                      </td>
                      <td
                        style={{ textAlign: "right" }}
                        className={isDeposit ? "credit-amount" : "debit-amount"}
                      >
                        {isDeposit ? "+" : "-"}
                        {formatCurrency(Number(tx.amount))}
                      </td>
                      <td
                        style={{ textAlign: "right" }}
                        className="font-mono text-muted-small"
                      >
                        {formatCurrency(Number(tx.balanceAfter))}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="table-action-btn"
                          onClick={() => setSelectedTx(tx)}
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

      {/* TRANSACTION DETAILS MODAL */}
      {selectedTx && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Transaction Details</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedTx(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="detail-label">Transaction ID</span>
                <span className="detail-value font-mono">#{selectedTx.id}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Date & Time</span>
                <span className="detail-value">
                  {new Date(selectedTx.transactionDate).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Transaction Type</span>
                <span
                  className={`badge ${
                    selectedTx.type?.toUpperCase() === "DEPOSIT"
                      ? "badge-success"
                      : "badge-danger"
                  }`}
                >
                  {selectedTx.type?.toUpperCase() === "DEPOSIT"
                    ? "DEPOSIT (Credit)"
                    : "WITHDRAWAL (Debit)"}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Amount</span>
                <span
                  className={`detail-value font-bold ${
                    selectedTx.type?.toUpperCase() === "DEPOSIT"
                      ? "credit-amount"
                      : "debit-amount"
                  }`}
                >
                  {selectedTx.type?.toUpperCase() === "DEPOSIT" ? "+" : "-"}
                  {formatCurrency(Number(selectedTx.amount))}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Balance After Transaction</span>
                <span className="detail-value font-bold font-mono">
                  {formatCurrency(Number(selectedTx.balanceAfter))}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Account Number</span>
                <span className="detail-value font-mono">
                  {selectedTx.account?.accountNumber || "N/A"}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Description</span>
                <span className="detail-value">
                  {selectedTx.description || "N/A"}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={() => setSelectedTx(null)}
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
