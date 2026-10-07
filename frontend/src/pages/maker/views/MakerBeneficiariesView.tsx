import { useState, useMemo } from "react";
import type {
  Beneficiary,
  Customer,
  CreateBeneficiaryRequest,
  UpdateBeneficiaryRequest,
} from "../../../types";
import { beneficiaryService } from "../../../services/beneficiaryService";

interface MakerBeneficiariesViewProps {
  beneficiaries: Beneficiary[];
  customers: Customer[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onBeneficiariesUpdated: () => void;
  selectedCustomerId?: number | "ALL";
  onSelectCustomer?: (customerId: number | "ALL") => void;
}

export default function MakerBeneficiariesView({
  beneficiaries,
  customers,
  loading,
  error,
  onRefresh,
  onBeneficiariesUpdated,
  selectedCustomerId = "ALL",
  onSelectCustomer,
}: MakerBeneficiariesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [deletingBeneficiary, setDeletingBeneficiary] = useState<Beneficiary | null>(null);
  const [viewingBeneficiary, setViewingBeneficiary] = useState<Beneficiary | null>(null);

  // Forms
  const [addForm, setAddForm] = useState<CreateBeneficiaryRequest>({
    customerId: customers[0]?.id || 8,
    name: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
  });

  const [editForm, setEditForm] = useState<UpdateBeneficiaryRequest>({
    name: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    status: "ACTIVE",
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const validateIFSC = (ifsc: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
  const validateAccNum = (acc: string) => /^[0-9]+$/.test(acc);

  const openAddModal = () => {
    setAddForm({
      customerId: customers[0]?.id || 8,
      name: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!addForm.name.trim() || addForm.name.length < 2 || addForm.name.length > 100) {
      setFormError("Name must be between 2 and 100 characters.");
      return;
    }
    if (!validateAccNum(addForm.accountNumber)) {
      setFormError("Account number must contain only digits.");
      return;
    }
    if (!addForm.bankName.trim()) {
      setFormError("Bank name is required.");
      return;
    }
    const ifscUpper = addForm.ifscCode.trim().toUpperCase();
    if (!validateIFSC(ifscUpper)) {
      setFormError("Invalid IFSC code format (e.g. SBIN0001234).");
      return;
    }

    try {
      setSubmitting(true);
      await beneficiaryService.createBeneficiary({
        ...addForm,
        ifscCode: ifscUpper,
      });
      setActionSuccess("Beneficiary payee registered successfully!");
      setIsAddOpen(false);
      onBeneficiariesUpdated();
    } catch (err: unknown) {
      console.error("Failed to create beneficiary:", err);
      setFormError("Failed to register beneficiary. Account may already exist for this customer.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (b: Beneficiary) => {
    setEditingBeneficiary(b);
    setEditForm({
      name: b.name,
      accountNumber: b.accountNumber,
      bankName: b.bankName,
      ifscCode: b.ifscCode,
      status: (b.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    });
    setFormError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBeneficiary) return;
    setFormError(null);

    if (!editForm.name.trim() || editForm.name.length < 2 || editForm.name.length > 100) {
      setFormError("Name must be between 2 and 100 characters.");
      return;
    }
    if (!validateAccNum(editForm.accountNumber)) {
      setFormError("Account number must contain only digits.");
      return;
    }
    if (!editForm.bankName.trim()) {
      setFormError("Bank name is required.");
      return;
    }
    const ifscUpper = editForm.ifscCode.trim().toUpperCase();
    if (!validateIFSC(ifscUpper)) {
      setFormError("Invalid IFSC code format (e.g. SBIN0001234).");
      return;
    }

    try {
      setSubmitting(true);
      await beneficiaryService.updateBeneficiary(editingBeneficiary.id, {
        ...editForm,
        ifscCode: ifscUpper,
      });
      setActionSuccess("Beneficiary updated successfully!");
      setEditingBeneficiary(null);
      onBeneficiariesUpdated();
    } catch (err: unknown) {
      console.error("Failed to update beneficiary:", err);
      setFormError("Failed to update beneficiary. Please verify details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingBeneficiary) return;

    try {
      setSubmitting(true);
      await beneficiaryService.deleteBeneficiary(deletingBeneficiary.id);
      setActionSuccess(`Beneficiary ${deletingBeneficiary.name} marked as INACTIVE.`);
      setDeletingBeneficiary(null);
      onBeneficiariesUpdated();
    } catch (err: unknown) {
      console.error("Failed to delete beneficiary:", err);
      alert("Failed to deactivate beneficiary.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) => {
      // Customer filter
      if (
        selectedCustomerId &&
        selectedCustomerId !== "ALL" &&
        b.customer?.id !== selectedCustomerId
      ) {
        return false;
      }
      // Status filter
      if (statusFilter !== "ALL" && b.status?.toUpperCase() !== statusFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nameMatch = (b.name || "").toLowerCase().includes(term);
        const bankMatch = (b.bankName || "").toLowerCase().includes(term);
        const accMatch = (b.accountNumber || "").toLowerCase().includes(term);
        const ifscMatch = (b.ifscCode || "").toLowerCase().includes(term);
        const custMatch = (b.customer?.name || "").toLowerCase().includes(term);
        if (!nameMatch && !bankMatch && !accMatch && !ifscMatch && !custMatch) return false;
      }
      return true;
    });
  }, [beneficiaries, selectedCustomerId, statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="view-card skeleton-container">
        <div className="skeleton-title"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <p className="loading-text">Loading beneficiaries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-card error-card">
        <h3>Unable to load beneficiaries</h3>
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
        <div className="header-actions">
          <button className="secondary-button" onClick={onRefresh}>
            🔄 Refresh
          </button>
          <button className="primary-button" onClick={openAddModal}>
            + Register Beneficiary
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
              <label htmlFor="maker-ben-filter-cust">Customer</label>
              <select
                id="maker-ben-filter-cust"
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
                    {c.id} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label htmlFor="maker-ben-filter-status">Status</label>
            <select
              id="maker-ben-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="filter-group filter-search">
            <label htmlFor="maker-search-ben">Search</label>
            <input
              id="maker-search-ben"
              type="text"
              placeholder="Search by payee, bank, IFSC, account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* BENEFICIARIES TABLE */}
      <div className="view-card">
        {filteredBeneficiaries.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📋</div>
            <h3>No Beneficiaries Found</h3>
            <p>
              {beneficiaries.length === 0
                ? "No beneficiaries have been registered yet."
                : "No payees match the active search/filter."}
            </p>
            {beneficiaries.length === 0 && (
              <button
                className="primary-button"
                onClick={openAddModal}
                style={{ marginTop: "12px" }}
              >
                + Register First Beneficiary
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Beneficiary Name</th>
                  <th>Customer Owner</th>
                  <th>Bank Name</th>
                  <th>Account Number</th>
                  <th>IFSC Code</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaries.map((b) => (
                  <tr key={b.id}>
                    <td className="font-semibold">{b.name}</td>
                    <td>
                      <span className="text-muted-small font-semibold">
                        {b.customer?.name || `Customer #${b.customer?.id || "N/A"}`}
                      </span>
                    </td>
                    <td>{b.bankName}</td>
                    <td className="font-mono text-muted-small">{b.accountNumber}</td>
                    <td className="font-mono">{b.ifscCode}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          b.status?.toLowerCase() === "active"
                            ? "status-active"
                            : "status-closed"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          className="table-action-btn"
                          onClick={() => setViewingBeneficiary(b)}
                        >
                          View
                        </button>
                        <button
                          className="table-action-btn"
                          onClick={() => openEditModal(b)}
                        >
                          ✏️ Edit
                        </button>
                        {b.status === "ACTIVE" && (
                          <button
                            className="table-action-btn"
                            style={{ borderColor: "#fca5a5", color: "#dc2626", background: "#fef2f2" }}
                            onClick={() => setDeletingBeneficiary(b)}
                            title="Deactivate Payee"
                          >
                            🚫
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

      {/* CREATE BENEFICIARY MODAL */}
      {isAddOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Register New Beneficiary Payee</h3>
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
                  <label htmlFor="maker-ben-cust">Customer Owner *</label>
                  <select
                    id="maker-ben-cust"
                    value={addForm.customerId}
                    onChange={(e) =>
                      setAddForm({ ...addForm, customerId: Number(e.target.value) })
                    }
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} - {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="maker-ben-name">Beneficiary Name *</label>
                  <input
                    id="maker-ben-name"
                    type="text"
                    value={addForm.name}
                    onChange={(e) =>
                      setAddForm({ ...addForm, name: e.target.value })
                    }
                    placeholder="e.g. Acme Corp"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="maker-ben-acc">Account Number *</label>
                  <input
                    id="maker-ben-acc"
                    type="text"
                    value={addForm.accountNumber}
                    onChange={(e) =>
                      setAddForm({ ...addForm, accountNumber: e.target.value })
                    }
                    placeholder="e.g. 987654321098"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="maker-ben-bank">Bank Name *</label>
                  <input
                    id="maker-ben-bank"
                    type="text"
                    value={addForm.bankName}
                    onChange={(e) =>
                      setAddForm({ ...addForm, bankName: e.target.value })
                    }
                    placeholder="e.g. HDFC Bank"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="maker-ben-ifsc">IFSC Code *</label>
                  <input
                    id="maker-ben-ifsc"
                    type="text"
                    value={addForm.ifscCode}
                    onChange={(e) =>
                      setAddForm({ ...addForm, ifscCode: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. HDFC0001234"
                    maxLength={11}
                    required
                  />
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
                  {submitting ? "Registering..." : "Register Beneficiary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BENEFICIARY MODAL */}
      {editingBeneficiary && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Edit Beneficiary {editingBeneficiary.id}</h3>
              <button className="modal-close" onClick={() => setEditingBeneficiary(null)}>
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
                  <label htmlFor="edit-maker-ben-name">Beneficiary Name *</label>
                  <input
                    id="edit-maker-ben-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-maker-ben-acc">Account Number *</label>
                  <input
                    id="edit-maker-ben-acc"
                    type="text"
                    value={editForm.accountNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, accountNumber: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-maker-ben-bank">Bank Name *</label>
                  <input
                    id="edit-maker-ben-bank"
                    type="text"
                    value={editForm.bankName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bankName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-maker-ben-ifsc">IFSC Code *</label>
                  <input
                    id="edit-maker-ben-ifsc"
                    type="text"
                    value={editForm.ifscCode}
                    onChange={(e) =>
                      setEditForm({ ...editForm, ifscCode: e.target.value.toUpperCase() })
                    }
                    maxLength={11}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-maker-ben-status">Status *</label>
                  <select
                    id="edit-maker-ben-status"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value as "ACTIVE" | "INACTIVE",
                      })
                    }
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingBeneficiary(null)}
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

      {/* DEACTIVATE / DELETE BENEFICIARY MODAL */}
      {deletingBeneficiary && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Deactivate Beneficiary Payee</h3>
              <button className="modal-close" onClick={() => setDeletingBeneficiary(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to deactivate beneficiary <strong>{deletingBeneficiary.name}</strong> ({deletingBeneficiary.bankName} - {deletingBeneficiary.accountNumber})?
              </p>
              <div className="alert-box error-alert">
                <span>⚠️ The beneficiary status will be set to INACTIVE.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeletingBeneficiary(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ background: "#dc2626" }}
                onClick={handleDeleteSubmit}
                disabled={submitting}
              >
                {submitting ? "Deactivating..." : "Confirm Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW BENEFICIARY DETAILS MODAL */}
      {viewingBeneficiary && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Beneficiary Details</h3>
              <button className="modal-close" onClick={() => setViewingBeneficiary(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="detail-label">Beneficiary ID</span>
                <span className="detail-value font-mono">#{viewingBeneficiary.id}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Payee Name</span>
                <span className="detail-value font-bold">{viewingBeneficiary.name}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Bank Name</span>
                <span className="detail-value">{viewingBeneficiary.bankName}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Account Number</span>
                <span className="detail-value font-mono">{viewingBeneficiary.accountNumber}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">IFSC Code</span>
                <span className="detail-value font-mono">{viewingBeneficiary.ifscCode}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Status</span>
                <span
                  className={`status-pill ${
                    viewingBeneficiary.status?.toLowerCase() === "active"
                      ? "status-active"
                      : "status-closed"
                  }`}
                >
                  {viewingBeneficiary.status}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="primary-button" onClick={() => setViewingBeneficiary(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
