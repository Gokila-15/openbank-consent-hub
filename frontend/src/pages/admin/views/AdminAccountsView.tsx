import { useState, useMemo } from "react";
import type {
  Account,
  Customer,
  CreateAccountRequest,
  UpdateAccountRequest,
  CreateTransactionRequest,
} from "../../../types";
import { accountService } from "../../../services/accountService";
import { transactionService } from "../../../services/transactionService";

interface AdminAccountsViewProps {
  accounts: Account[];
  customers: Customer[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onAccountsUpdated: () => void;
}

export default function AdminAccountsView({
  accounts,
  customers,
  loading,
  error,
  onRefresh,
  onAccountsUpdated,
}: AdminAccountsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [closingAccount, setClosingAccount] = useState<Account | null>(null);
  const [transactingAccount, setTransactingAccount] = useState<Account | null>(null);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);

  // Forms
  const [addForm, setAddForm] = useState<CreateAccountRequest>({
    customerId: customers[0]?.id || 0,
    accountNumber: "",
    accountType: "SAVINGS",
  });

  const [editForm, setEditForm] = useState<UpdateAccountRequest>({
    accountType: "SAVINGS",
    status: "ACTIVE",
  });

  const [txForm, setTxForm] = useState<CreateTransactionRequest>({
    accountId: 0,
    type: "DEPOSIT",
    amount: 1000,
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const openAddModal = () => {
    const randomAcc = "100" + Math.floor(100000000 + Math.random() * 900000000);
    setAddForm({
      customerId: customers[0]?.id || 0,
      accountNumber: randomAcc,
      accountType: "SAVINGS",
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!addForm.accountNumber.trim()) {
      setFormError("Account number is required.");
      return;
    }
    if (!addForm.customerId) {
      setFormError("Please select a customer.");
      return;
    }

    try {
      setSubmitting(true);
      await accountService.createAccount(addForm);
      setActionSuccess(`Account ${addForm.accountNumber} created successfully!`);
      setIsAddOpen(false);
      onAccountsUpdated();
    } catch (err: any) {
      console.error("Failed to create account:", err);
      setFormError(err?.response?.data?.message || "Failed to create account. Ensure account number is unique.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setEditForm({
      accountType: acc.accountType || "SAVINGS",
      status: acc.status || "ACTIVE",
    });
    setFormError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setFormError(null);

    try {
      setSubmitting(true);
      await accountService.updateAccount(editingAccount.id, editForm);
      setActionSuccess(`Account #${editingAccount.accountNumber} updated successfully!`);
      setEditingAccount(null);
      onAccountsUpdated();
    } catch (err: any) {
      console.error("Failed to update account:", err);
      setFormError(err?.response?.data?.message || "Failed to update account.");
    } finally {
      setSubmitting(false);
    }
  };

  const openTxModal = (acc: Account) => {
    setTransactingAccount(acc);
    setTxForm({
      accountId: acc.id,
      type: "DEPOSIT",
      amount: 1000,
      description: "Admin manual adjustment",
    });
    setFormError(null);
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactingAccount) return;
    setFormError(null);

    if (!txForm.amount || Number(txForm.amount) <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    try {
      setSubmitting(true);
      await transactionService.createTransaction({
        ...txForm,
        accountId: transactingAccount.id,
        amount: Number(txForm.amount),
      });
      setActionSuccess(`Transaction completed: ${txForm.type} of ${formatCurrency(Number(txForm.amount))} on account #${transactingAccount.accountNumber}`);
      setTransactingAccount(null);
      onAccountsUpdated();
    } catch (err: any) {
      console.error("Transaction failed:", err);
      let msg = "Failed to process transaction.";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAccount = async () => {
    if (!closingAccount) return;
    try {
      setSubmitting(true);
      await accountService.deleteAccount(closingAccount.id);
      setActionSuccess(`Account #${closingAccount.accountNumber} closed successfully.`);
      setClosingAccount(null);
      onAccountsUpdated();
    } catch (err: any) {
      console.error("Failed to close account:", err);
      setActionSuccess(null);
      alert(err?.response?.data?.message || "Failed to close account.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Type filter
      if (typeFilter !== "ALL" && acc.accountType?.toUpperCase() !== typeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== "ALL" && acc.status?.toUpperCase() !== statusFilter) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const numMatch = acc.accountNumber?.toLowerCase().includes(term);
        const nameMatch = acc.customer?.name?.toLowerCase().includes(term);
        const custIdMatch = acc.customer?.id?.toString().includes(term);
        const typeMatch = acc.accountType?.toLowerCase().includes(term);
        if (!numMatch && !nameMatch && !custIdMatch && !typeMatch) return false;
      }
      return true;
    });
  }, [accounts, typeFilter, statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="view-card skeleton-container">
        <div className="skeleton-title" style={{ width: "240px" }}></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <p className="loading-text">Loading bank accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-card error-card">
        <h3>Unable to load accounts</h3>
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
          <button className="secondary-button" onClick={onRefresh}>
            🔄 Refresh
          </button>
          <button className="primary-button" onClick={openAddModal}>
            + Open New Account
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert-box success-alert">
          <span>✓ {actionSuccess}</span>
          <button className="alert-close" onClick={() => setActionSuccess(null)}>×</button>
        </div>
      )}

      {/* FILTERS */}
      <div className="view-card filter-bar-card">
        <div className="filters-grid">
          <div className="filter-group filter-search" style={{ flex: 1 }}>
            <label htmlFor="admin-search-acc">Search Accounts</label>
            <input
              id="admin-search-acc"
              type="text"
              placeholder="Search by account number, customer name, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="admin-acc-type">Account Type</label>
            <select
              id="admin-acc-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="SAVINGS">Savings</option>
              <option value="CURRENT">Current</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="admin-acc-status">Status</label>
            <select
              id="admin-acc-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE Only</option>
              <option value="CLOSED">CLOSED Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ACCOUNTS TABLE */}
      <div className="view-card">
        {filteredAccounts.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">💳</div>
            <h3>No Accounts Found</h3>
            <p>
              {accounts.length === 0
                ? "No bank accounts have been opened yet in the system."
                : "No accounts matched the search and filter criteria."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Account No</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="font-mono font-semibold">
                      {acc.accountNumber}
                    </td>
                    <td>
                      <div className="customer-cell">
                        <span className="font-semibold text-main">
                          {acc.customer?.name || `Customer #${acc.customer?.id || "N/A"}`}
                        </span>
                        {acc.customer?.email && (
                          <span className="text-muted-small font-mono">{acc.customer.email}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="account-type-badge">{acc.accountType}</span>
                    </td>
                    <td className="font-bold text-main">
                      {formatCurrency(Number(acc.balance || 0))}
                    </td>
                    <td>
                      <span className={`status-pill ${acc.status?.toUpperCase() === "ACTIVE" ? "status-active" : "status-closed"}`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="text-muted-small font-mono">
                      {acc.createdAt
                        ? new Date(acc.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="admin-actions-cell">
                        <button
                          className="table-action-btn"
                          onClick={() => setViewingAccount(acc)}
                          title="View account details"
                        >
                          Details
                        </button>
                        {acc.status?.toUpperCase() === "ACTIVE" && (
                          <button
                            className="table-action-btn"
                            style={{ color: "#0284c7", borderColor: "rgba(2, 132, 199, 0.3)" }}
                            onClick={() => openTxModal(acc)}
                            title="Deposit or withdraw funds"
                          >
                            Transact
                          </button>
                        )}
                        <button
                          className="table-action-btn admin-edit-btn"
                          onClick={() => openEditModal(acc)}
                          title="Update account type or status"
                        >
                          Edit
                        </button>
                        {acc.status?.toUpperCase() === "ACTIVE" && (
                          <button
                            className="table-action-btn admin-delete-btn"
                            onClick={() => setClosingAccount(acc)}
                            title="Close this account"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE TRANSACTION (DEPOSIT/WITHDRAWAL) MODAL */}
      {transactingAccount && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Account Transaction #{transactingAccount.accountNumber}</h3>
              <button className="modal-close" onClick={() => setTransactingAccount(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleTxSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box error-alert">
                    <span>⚠️ {formError}</span>
                  </div>
                )}
                <div className="modal-detail-row">
                  <span className="detail-label">Account Owner</span>
                  <span className="detail-value font-semibold">
                    {transactingAccount.customer?.name || "Client"}
                  </span>
                </div>
                <div className="modal-detail-row">
                  <span className="detail-label">Current Balance</span>
                  <span className="detail-value font-bold font-mono">
                    {formatCurrency(Number(transactingAccount.balance))}
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="admin-acc-tx-type">Transaction Type *</label>
                  <select
                    id="admin-acc-tx-type"
                    value={txForm.type}
                    onChange={(e) =>
                      setTxForm({ ...txForm, type: e.target.value as "DEPOSIT" | "WITHDRAWAL" })
                    }
                  >
                    <option value="DEPOSIT">DEPOSIT (Credit)</option>
                    <option value="WITHDRAWAL">WITHDRAWAL (Debit)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="admin-acc-tx-amount">Amount (₹) *</label>
                  <input
                    id="admin-acc-tx-amount"
                    type="number"
                    step="0.01"
                    min="1"
                    value={txForm.amount}
                    onChange={(e) =>
                      setTxForm({ ...txForm, amount: Number(e.target.value) })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="admin-acc-tx-desc">Description</label>
                  <input
                    id="admin-acc-tx-desc"
                    type="text"
                    value={txForm.description || ""}
                    onChange={(e) =>
                      setTxForm({ ...txForm, description: e.target.value })
                    }
                    placeholder="e.g. Deposit, Branch adjustment"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setTransactingAccount(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Processing..." : "Submit Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ACCOUNT MODAL */}
      {isAddOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Open Bank Account</h3>
              <button className="modal-close" onClick={() => setIsAddOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box error-alert">
                    <span>⚠️ {formError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="admin-acc-cust">Account Owner *</label>
                  <select
                    id="admin-acc-cust"
                    value={addForm.customerId}
                    onChange={(e) => setAddForm({ ...addForm, customerId: Number(e.target.value) })}
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        #{c.id} - {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="admin-acc-num">Account Number *</label>
                  <input
                    id="admin-acc-num"
                    type="text"
                    value={addForm.accountNumber}
                    onChange={(e) => setAddForm({ ...addForm, accountNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="admin-acc-type-select">Account Type *</label>
                  <select
                    id="admin-acc-type-select"
                    value={addForm.accountType}
                    onChange={(e) => setAddForm({ ...addForm, accountType: e.target.value })}
                  >
                    <option value="SAVINGS">Savings Account</option>
                    <option value="CURRENT">Current / Checking Account</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsAddOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Opening..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACCOUNT MODAL */}
      {editingAccount && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Edit Account #{editingAccount.accountNumber}</h3>
              <button className="modal-close" onClick={() => setEditingAccount(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box error-alert">
                    <span>⚠️ {formError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label>Account Type</label>
                  <select
                    value={editForm.accountType}
                    onChange={(e) => setEditForm({ ...editForm, accountType: e.target.value })}
                  >
                    <option value="SAVINGS">SAVINGS</option>
                    <option value="CURRENT">CURRENT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingAccount(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingAccount && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Account #{viewingAccount.accountNumber}</h3>
              <button className="modal-close" onClick={() => setViewingAccount(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="detail-label">Account Number</span>
                <span className="detail-value font-mono font-bold">{viewingAccount.accountNumber}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Owner</span>
                <span className="detail-value font-semibold">{viewingAccount.customer?.name || "N/A"}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Type</span>
                <span className="detail-value">{viewingAccount.accountType}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Current Balance</span>
                <span className="detail-value font-bold text-main">{formatCurrency(Number(viewingAccount.balance || 0))}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  <span className={`status-pill ${viewingAccount.status?.toUpperCase() === "ACTIVE" ? "status-active" : "status-closed"}`}>
                    {viewingAccount.status}
                  </span>
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Created At</span>
                <span className="detail-value font-mono text-muted-small">
                  {viewingAccount.createdAt ? new Date(viewingAccount.createdAt).toLocaleString("en-IN") : "N/A"}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="primary-button" onClick={() => setViewingAccount(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE CONFIRM MODAL */}
      {closingAccount && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Confirm Account Closure</h3>
              <button className="modal-close" onClick={() => setClosingAccount(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="checker-confirm-box">
                <div className="confirm-icon">⚠️</div>
                <h4 className="confirm-title">Close Account #{closingAccount.accountNumber}?</h4>
                <p className="confirm-text">
                  This will set the status of this account to <strong>CLOSED</strong>.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={() => setClosingAccount(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn-reject-confirm"
                onClick={handleCloseAccount}
                disabled={submitting}
              >
                {submitting ? "Closing..." : "Yes, Close Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
