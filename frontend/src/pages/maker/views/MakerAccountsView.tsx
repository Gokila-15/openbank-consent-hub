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

interface MakerAccountsViewProps {
  accounts: Account[];
  customers: Customer[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onAccountsUpdated: () => void;
  selectedCustomerId?: number | "ALL";
  onSelectCustomer?: (customerId: number | "ALL") => void;
}

export default function MakerAccountsView({
  accounts,
  customers,
  loading,
  error,
  onRefresh,
  onAccountsUpdated,
  selectedCustomerId = "ALL",
  onSelectCustomer,
}: MakerAccountsViewProps) {
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
    customerId: customers[0]?.id || 8,
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
    // Generate a random 12-digit account number suggestion
    const randomAcc = "100" + Math.floor(100000000 + Math.random() * 900000000);
    setAddForm({
      customerId: customers[0]?.id || 8,
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
      setActionSuccess("Account created successfully!");
      setIsAddOpen(false);
      onAccountsUpdated();
    } catch (err: unknown) {
      console.error("Failed to create account:", err);
      setFormError("Failed to create account. Account number may already exist.");
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
      setActionSuccess("Account updated successfully!");
      setEditingAccount(null);
      onAccountsUpdated();
    } catch (err: unknown) {
      console.error("Failed to update account:", err);
      setFormError("Failed to update account. Please verify details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSubmit = async () => {
    if (!closingAccount) return;

    try {
      setSubmitting(true);
      await accountService.deleteAccount(closingAccount.id);
      setActionSuccess(`Account ${closingAccount.accountNumber} has been CLOSED.`);
      setClosingAccount(null);
      onAccountsUpdated();
    } catch (err: unknown) {
      console.error("Failed to close account:", err);
      alert("Failed to close account. It may already be closed.");
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
      description: "Maker Deposit",
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
      setActionSuccess(`Transaction completed: ${txForm.type} of ${formatCurrency(Number(txForm.amount))}`);
      setTransactingAccount(null);
      onAccountsUpdated();
    } catch (err: unknown) {
      console.error("Transaction failed:", err);
      setFormError("Failed to process transaction. Check account status or balance.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Customer filter
      if (
        selectedCustomerId &&
        selectedCustomerId !== "ALL" &&
        acc.customer?.id !== selectedCustomerId
      ) {
        return false;
      }
      // Type filter
      if (typeFilter !== "ALL" && acc.accountType?.toUpperCase() !== typeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== "ALL" && acc.status?.toUpperCase() !== statusFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const numMatch = (acc.accountNumber || "").toLowerCase().includes(term);
        const nameMatch = (acc.customer?.name || "").toLowerCase().includes(term);
        const typeMatch = (acc.accountType || "").toLowerCase().includes(term);
        if (!numMatch && !nameMatch && !typeMatch) return false;
      }
      return true;
    });
  }, [accounts, selectedCustomerId, typeFilter, statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="view-card skeleton-container">
        <div className="skeleton-title"></div>
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
          <h2>Accounts Management</h2>
          <p>Create, manage, and service customer bank accounts</p>
        </div>
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

      {/* FILTER BAR */}
      <div className="view-card filter-bar-card">
        <div className="filters-grid">
          {onSelectCustomer && (
            <div className="filter-group">
              <label htmlFor="maker-filter-cust">Customer</label>
              <select
                id="maker-filter-cust"
                value={selectedCustomerId}
                onChange={(e) =>
                  onSelectCustomer(
                    e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                  )
                }
              >
                <option value="ALL">All Customers ({customers.length})</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label htmlFor="maker-filter-type">Account Type</label>
            <select
              id="maker-filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="SAVINGS">SAVINGS</option>
              <option value="CHECKING">CHECKING</option>
              <option value="CURRENT">CURRENT</option>
              <option value="FIXED_DEPOSIT">FIXED_DEPOSIT</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="maker-filter-status">Status</label>
            <select
              id="maker-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <div className="filter-group filter-search">
            <label htmlFor="maker-search-acc">Search</label>
            <input
              id="maker-search-acc"
              type="text"
              placeholder="Search account #, owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                ? "No bank accounts exist in the system yet."
                : "No accounts match the chosen filter."}
            </p>
            {accounts.length === 0 && (
              <button
                className="primary-button"
                onClick={openAddModal}
                style={{ marginTop: "12px" }}
              >
                + Open First Account
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Account #</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Balance</th>
                  <th>Status</th>
                  <th>Opened Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="font-mono font-semibold">{acc.accountNumber}</td>
                    <td>
                      <span className="font-semibold">
                        {acc.customer?.name || `Customer #${acc.customer?.id || "N/A"}`}
                      </span>
                    </td>
                    <td>
                      <span className="account-type-badge">{acc.accountType}</span>
                    </td>
                    <td style={{ textAlign: "right" }} className="font-mono font-bold">
                      {formatCurrency(Number(acc.balance))}
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          acc.status?.toLowerCase() === "active"
                            ? "status-active"
                            : "status-closed"
                        }`}
                      >
                        {acc.status}
                      </span>
                    </td>
                    <td className="text-muted-small font-mono">
                      {acc.createdAt
                        ? new Date(acc.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          className="table-action-btn"
                          onClick={() => setViewingAccount(acc)}
                        >
                          View
                        </button>
                        <button
                          className="table-action-btn"
                          onClick={() => openTxModal(acc)}
                          title="Perform Deposit/Withdrawal"
                        >
                          💸 Transact
                        </button>
                        <button
                          className="table-action-btn"
                          onClick={() => openEditModal(acc)}
                        >
                          ✏️ Edit
                        </button>
                        {acc.status === "ACTIVE" && (
                          <button
                            className="table-action-btn"
                            style={{ borderColor: "#fca5a5", color: "#dc2626", background: "#fef2f2" }}
                            onClick={() => setClosingAccount(acc)}
                            title="Close Account"
                          >
                            🔒 Close
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

      {/* CREATE ACCOUNT MODAL */}
      {isAddOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Open New Bank Account</h3>
              <button className="modal-close" onClick={() => setIsAddOpen(false)}>
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
                  <label htmlFor="maker-acc-cust">Account Owner (Customer) *</label>
                  <select
                    id="maker-acc-cust"
                    value={addForm.customerId}
                    onChange={(e) =>
                      setAddForm({ ...addForm, customerId: Number(e.target.value) })
                    }
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
                  <label htmlFor="maker-acc-num">Account Number *</label>
                  <input
                    id="maker-acc-num"
                    type="text"
                    value={addForm.accountNumber}
                    onChange={(e) =>
                      setAddForm({ ...addForm, accountNumber: e.target.value })
                    }
                    placeholder="e.g. 100987654321"
                    required
                  />
                  <small className="form-help">Unique bank account identifier</small>
                </div>

                <div className="form-group">
                  <label htmlFor="maker-acc-type">Account Type *</label>
                  <select
                    id="maker-acc-type"
                    value={addForm.accountType}
                    onChange={(e) =>
                      setAddForm({ ...addForm, accountType: e.target.value })
                    }
                  >
                    <option value="SAVINGS">SAVINGS</option>
                    <option value="CHECKING">CHECKING</option>
                    <option value="CURRENT">CURRENT</option>
                    <option value="FIXED_DEPOSIT">FIXED_DEPOSIT</option>
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
                  {submitting ? "Opening..." : "Open Account"}
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
              <h3>Edit Account {editingAccount.accountNumber}</h3>
              <button className="modal-close" onClick={() => setEditingAccount(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box error-alert">
                    <span>⚠️ {formError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="edit-acc-type">Account Type *</label>
                  <select
                    id="edit-acc-type"
                    value={editForm.accountType}
                    onChange={(e) =>
                      setEditForm({ ...editForm, accountType: e.target.value })
                    }
                  >
                    <option value="SAVINGS">SAVINGS</option>
                    <option value="CHECKING">CHECKING</option>
                    <option value="CURRENT">CURRENT</option>
                    <option value="FIXED_DEPOSIT">FIXED_DEPOSIT</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-acc-status">Account Status *</label>
                  <select
                    id="edit-acc-status"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
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

      {/* CLOSE ACCOUNT MODAL */}
      {closingAccount && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Close Account {closingAccount.accountNumber}</h3>
              <button className="modal-close" onClick={() => setClosingAccount(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to mark account{" "}
                <strong>{closingAccount.accountNumber}</strong> as{" "}
                <strong>CLOSED</strong>?
              </p>
              <div className="alert-box error-alert">
                <span>
                  ⚠️ Closed accounts cannot perform further transactions.
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setClosingAccount(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ background: "#dc2626" }}
                onClick={handleCloseSubmit}
                disabled={submitting}
              >
                {submitting ? "Closing..." : "Confirm Close Account"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <span className="detail-label">Current Balance</span>
                  <span className="detail-value font-bold font-mono">
                    {formatCurrency(Number(transactingAccount.balance))}
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="tx-type">Transaction Type *</label>
                  <select
                    id="tx-type"
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
                  <label htmlFor="tx-amount">Amount (₹) *</label>
                  <input
                    id="tx-amount"
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
                  <label htmlFor="tx-desc">Description</label>
                  <input
                    id="tx-desc"
                    type="text"
                    value={txForm.description || ""}
                    onChange={(e) =>
                      setTxForm({ ...txForm, description: e.target.value })
                    }
                    placeholder="e.g. Initial Branch Deposit, Fee adjustment"
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

      {/* VIEW ACCOUNT DETAILS MODAL */}
      {viewingAccount && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Account Record #{viewingAccount.id}</h3>
              <button className="modal-close" onClick={() => setViewingAccount(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="detail-label">Account Number</span>
                <span className="detail-value font-mono font-bold">
                  {viewingAccount.accountNumber}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Account Owner</span>
                <span className="detail-value font-semibold">
                  {viewingAccount.customer?.name} (ID #{viewingAccount.customer?.id})
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Account Type</span>
                <span className="account-type-badge">{viewingAccount.accountType}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Current Balance</span>
                <span className="detail-value font-bold font-mono">
                  {formatCurrency(Number(viewingAccount.balance))}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Status</span>
                <span
                  className={`status-pill ${
                    viewingAccount.status?.toLowerCase() === "active"
                      ? "status-active"
                      : "status-closed"
                  }`}
                >
                  {viewingAccount.status}
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Opened At</span>
                <span className="detail-value">
                  {new Date(viewingAccount.createdAt).toLocaleString("en-IN")}
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
    </div>
  );
}
