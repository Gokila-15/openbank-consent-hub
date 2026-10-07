import { useState, useMemo } from "react";
import type { Transaction, Account, CreateTransactionRequest } from "../../../types";
import { transactionService } from "../../../services/transactionService";

interface MakerTransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onTransactionCreated: () => void;
}

export default function MakerTransactionsView({
  transactions,
  accounts,
  loading,
  error,
  onRefresh,
  onTransactionCreated,
}: MakerTransactionsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);

  // Create Transaction Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(accounts[0]?.id || 0);
  const [txType, setTxType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");
  const [amount, setAmount] = useState<number>(1000);
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const openCreateModal = () => {
    setSelectedAccountId(accounts[0]?.id || 0);
    setTxType("DEPOSIT");
    setAmount(1000);
    setDescription("Maker transaction");
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetAccId = Number(selectedAccountId);
    if (!targetAccId) {
      setFormError("Please select a target account.");
      return;
    }

    if (!amount || amount <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    try {
      setSubmitting(true);
      const req: CreateTransactionRequest = {
        accountId: targetAccId,
        type: txType,
        amount: Number(amount),
        description: description.trim() || undefined,
      };

      await transactionService.createTransaction(req);
      setSuccessMessage(`Transaction created successfully: ${txType} ${formatCurrency(amount)}`);
      setIsCreateOpen(false);
      onTransactionCreated();
    } catch (err: any) {
      console.error("Failed to create transaction:", err);
      let msg = "Failed to process transaction.";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
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
       
        <div className="header-actions">
          <button className="primary-button" onClick={openCreateModal}>
            + Create Transaction
          </button>
          <button className="secondary-button" onClick={onRefresh}>
            🔄 Refresh 
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="alert-box success-alert" style={{ marginBottom: "16px" }}>
          <span>✓ {successMessage}</span>
          <button className="alert-close" onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      {/* MINI STATS */}
      <div className="admin-summary-grid" style={{ marginBottom: "18px" }}>
        <div className="summary-card admin-stat-card">
          <p>Total Transactions</p>
          <h2>{transactions.length}</h2>
          <span>Total Entries</span>
        </div>
        <div className="summary-card admin-stat-card">
          <p>Total Transaction Volume</p>
          <h2>{formatCurrency(totalVolume)}</h2>
          <span>Total Amount</span>
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
            <label htmlFor="maker-search-tx">Search Transactions</label>
            <input
              id="maker-search-tx"
              type="text"
              placeholder="Search by ID, Account No, Customer Name, Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="maker-tx-type">Transaction Type</label>
            <select
              id="maker-tx-type"
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
                ? "No transactions have been processed yet."
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

      {/* CREATE TRANSACTION MODAL */}
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Create New Transaction</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box error-alert">
                    <span>⚠️ {formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="maker-create-tx-acc">Target Account *</label>
                  {accounts.length === 0 ? (
                    <p className="text-muted-small">No accounts available.</p>
                  ) : (
                    <select
                      id="maker-create-tx-acc"
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                      required
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} — {acc.customer?.name || "Client"} ({acc.accountType}) [Bal: {formatCurrency(Number(acc.balance))}]
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="maker-create-tx-type">Transaction Type *</label>
                  <select
                    id="maker-create-tx-type"
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as "DEPOSIT" | "WITHDRAWAL")}
                  >
                    <option value="DEPOSIT">DEPOSIT (Credit)</option>
                    <option value="WITHDRAWAL">WITHDRAWAL (Debit)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="maker-create-tx-amount">Amount (₹) *</label>
                  <input
                    id="maker-create-tx-amount"
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="maker-create-tx-desc">Description</label>
                  <input
                    id="maker-create-tx-desc"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Branch deposit, Maker transfer"
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
                  disabled={submitting || accounts.length === 0}
                >
                  {submitting ? "Processing..." : "Submit Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
