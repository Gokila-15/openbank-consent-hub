import { useState, useMemo } from "react";
import type { Transaction } from "../../../types";

interface AdminTransactionsViewProps {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function AdminTransactionsView({
  transactions,
  loading,
  error,
  onRefresh,
}: AdminTransactionsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const filteredTransactions = useMemo(() => {
    const list = [...transactions];

    // Sort latest first
    list.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

    return list.filter((tx) => {
      // Type Filter
      if (typeFilter !== "ALL" && tx.type?.toUpperCase() !== typeFilter) {
        return false;
      }

      // Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const idMatch = tx.id?.toString().includes(term);
        const accMatch = tx.account?.accountNumber?.toLowerCase().includes(term);
        const descMatch = tx.description?.toLowerCase().includes(term);
        const amountMatch = tx.amount?.toString().includes(term);
        const custMatch = tx.account?.customer?.name?.toLowerCase().includes(term);

        if (!idMatch && !accMatch && !descMatch && !amountMatch && !custMatch) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, searchTerm]);

  const totalVolume = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const totalDeposits = transactions
    .filter((tx) => tx.type?.toUpperCase() === "DEPOSIT")
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const totalWithdrawals = transactions
    .filter((tx) => tx.type?.toUpperCase() === "WITHDRAWAL")
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  if (loading) {
    return (
      <div className="view-card skeleton-container">
        <div className="skeleton-title" style={{ width: "240px" }}></div>
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
        <button className="primary-button" onClick={onRefresh} style={{ marginTop: "12px" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="view-container">
      {/* HEADER */}
      <div className="section-header-modern">
        <div>
          <h2>System-Wide Transactions Ledger</h2>
          <p>Real-time audit log of all financial deposits, withdrawals, and account balances across the bank</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={onRefresh}>
            🔄 Refresh Ledger
          </button>
        </div>
      </div>

      {/* MINI STATS */}
      <div className="admin-summary-grid" style={{ marginBottom: "18px" }}>
        <div className="summary-card admin-stat-card">
          <p>Total Ledger Entries</p>
          <h2>{transactions.length}</h2>
          <span>Recorded in PostgreSQL</span>
        </div>
        <div className="summary-card admin-stat-card">
          <p>Total Transaction Volume</p>
          <h2>{formatCurrency(totalVolume)}</h2>
          <span>Cumulative Flow</span>
        </div>
        <div className="summary-card admin-stat-card">
          <p>Total Deposits</p>
          <h2 className="credit-amount">{formatCurrency(totalDeposits)}</h2>
          <span>Credit Inflow</span>
        </div>
        <div className="summary-card admin-stat-card">
          <p>Total Withdrawals</p>
          <h2 className="debit-amount">{formatCurrency(totalWithdrawals)}</h2>
          <span>Debit Outflow</span>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="view-card filter-bar-card">
        <div className="filters-grid">
          <div className="filter-group filter-search" style={{ flex: 1 }}>
            <label htmlFor="admin-search-tx">Search Transactions</label>
            <input
              id="admin-search-tx"
              type="text"
              placeholder="Search by ID, Account No, Customer Name, Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="admin-tx-type">Transaction Type</label>
            <select
              id="admin-tx-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types ({transactions.length})</option>
              <option value="DEPOSIT">DEPOSIT Only</option>
              <option value="WITHDRAWAL">WITHDRAWAL Only</option>
            </select>
          </div>

          {(searchTerm || typeFilter !== "ALL") && (
            <button
              className="secondary-button"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("ALL");
              }}
              style={{ alignSelf: "flex-end" }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="view-card">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📈</div>
            <h3>No Transactions Found</h3>
            <p>
              {transactions.length === 0
                ? "No transactions have been processed yet in OpenBank."
                : "No transactions matched the search and filter criteria."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tx ID</th>
                  <th>Account No</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Date & Time</th>
                  <th>Description</th>
                  <th style={{ textAlign: "center" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isDeposit = tx.type?.toUpperCase() === "DEPOSIT";

                  return (
                    <tr key={tx.id}>
                      <td className="font-mono font-semibold">#{tx.id}</td>
                      <td className="font-mono font-semibold">
                        {tx.account?.accountNumber || "N/A"}
                      </td>
                      <td>
                        <span className="font-semibold text-main">
                          {tx.account?.customer?.name || "Client"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${isDeposit ? "status-active" : "status-closed"}`}>
                          {isDeposit ? "↓ DEPOSIT" : "↑ WITHDRAWAL"}
                        </span>
                      </td>
                      <td className={`font-bold ${isDeposit ? "credit-amount" : "debit-amount"}`}>
                        {isDeposit ? "+" : "-"}{formatCurrency(Number(tx.amount || 0))}
                      </td>
                      <td className="font-mono font-semibold text-main">
                        {tx.balanceAfter !== undefined ? formatCurrency(Number(tx.balanceAfter)) : "—"}
                      </td>
                      <td className="text-muted-small font-mono">
                        {tx.transactionDate
                          ? new Date(tx.transactionDate).toLocaleString("en-IN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "N/A"}
                      </td>
                      <td className="text-muted-small">
                        {tx.description || "General transfer"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="table-action-btn"
                          onClick={() => setViewingTx(tx)}
                        >
                          View
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

      {/* DETAIL MODAL */}
      {viewingTx && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Transaction #{viewingTx.id}</h3>
              <button className="modal-close" onClick={() => setViewingTx(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="detail-label">Transaction ID</span>
                <span className="detail-value font-mono font-bold">#{viewingTx.id}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Account</span>
                <span className="detail-value font-mono">{viewingTx.account?.accountNumber || "N/A"}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Account Type</span>
                <span className="detail-value">{viewingTx.account?.accountType || "SAVINGS"}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Customer</span>
                <span className="detail-value font-semibold">{viewingTx.account?.customer?.name || "N/A"}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Type</span>
                <span className="detail-value font-bold">{viewingTx.type}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Amount</span>
                <span className={`detail-value font-bold ${viewingTx.type?.toUpperCase() === "DEPOSIT" ? "credit-amount" : "debit-amount"}`}>
                  {formatCurrency(Number(viewingTx.amount || 0))}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Balance After Transaction</span>
                <span className="detail-value font-mono font-bold">{formatCurrency(Number(viewingTx.balanceAfter || 0))}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Description</span>
                <span className="detail-value">{viewingTx.description || "N/A"}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Timestamp</span>
                <span className="detail-value font-mono text-muted-small">
                  {viewingTx.transactionDate ? new Date(viewingTx.transactionDate).toLocaleString("en-IN") : "N/A"}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="primary-button" onClick={() => setViewingTx(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
