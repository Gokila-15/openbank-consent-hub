import { useState, useMemo } from "react";
import type { Beneficiary, Customer, CreateBeneficiaryRequest, UpdateBeneficiaryRequest } from "../../../types";
import { beneficiaryService } from "../../../services/beneficiaryService";

interface AdminBeneficiariesViewProps {
  beneficiaries: Beneficiary[];
  customers: Customer[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onBeneficiariesUpdated: () => void;
}

export default function AdminBeneficiariesView({
  beneficiaries,
  customers,
  loading,
  error,
  onRefresh,
  onBeneficiariesUpdated,
}: AdminBeneficiariesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBen, setEditingBen] = useState<Beneficiary | null>(null);
  const [deletingBen, setDeletingBen] = useState<Beneficiary | null>(null);
  const [viewingBen, setViewingBen] = useState<Beneficiary | null>(null);

  // Forms
  const [addForm, setAddForm] = useState<CreateBeneficiaryRequest>({
    customerId: customers[0]?.id || 0,
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

  const openAddModal = () => {
    setAddForm({
      customerId: customers[0]?.id || 0,
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

    const accNum = addForm.accountNumber.trim();
    if (!addForm.name.trim() || !accNum || !addForm.bankName.trim() || !addForm.ifscCode.trim()) {
      setFormError("All payee fields are required.");
      return;
    }
    if (!/^[0-9]{9,18}$/.test(accNum)) {
      setFormError("Account number must contain 9 to 18 digits.");
      return;
    }

    try {
      setSubmitting(true);
      await beneficiaryService.createBeneficiary(addForm);
      setActionSuccess(`Beneficiary "${addForm.name}" added successfully!`);
      setIsAddOpen(false);
      onBeneficiariesUpdated();
    } catch (err: any) {
      console.error("Failed to create beneficiary:", err);
      setFormError(err?.response?.data?.message || "Failed to create beneficiary.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (b: Beneficiary) => {
    setEditingBen(b);
    setEditForm({
      name: b.name || "",
      accountNumber: b.accountNumber || "",
      bankName: b.bankName || "",
      ifscCode: b.ifscCode || "",
      status: b.status || "ACTIVE",
    });
    setFormError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBen) return;
    setFormError(null);
    const accNum = editForm.accountNumber.trim();
    if (!editForm.name.trim() || !accNum || !editForm.bankName.trim() || !editForm.ifscCode.trim()) {
      setFormError("All payee fields are required.");
      return;
    }
    if (!/^[0-9]{9,18}$/.test(accNum)) {
      setFormError("Account number must contain 9 to 18 digits.");
      return;
    }

    try {
      setSubmitting(true);
      await beneficiaryService.updateBeneficiary(editingBen.id, editForm);
      setActionSuccess(`Beneficiary "${editForm.name}" updated successfully!`);
      setEditingBen(null);
      onBeneficiariesUpdated();
    } catch (err: any) {
      console.error("Failed to update beneficiary:", err);
      setFormError(err?.response?.data?.message || "Failed to update beneficiary.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingBen) return;
    try {
      setSubmitting(true);
      await beneficiaryService.deleteBeneficiary(deletingBen.id);
      setActionSuccess(`Beneficiary "${deletingBen.name}" deleted.`);
      setDeletingBen(null);
      onBeneficiariesUpdated();
    } catch (err: any) {
      console.error("Failed to delete beneficiary:", err);
      alert(err?.response?.data?.message || "Failed to delete beneficiary.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) => {
      // Status filter
      if (statusFilter !== "ALL" && b.status?.toUpperCase() !== statusFilter) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nameMatch = b.name?.toLowerCase().includes(term);
        const accMatch = b.accountNumber?.toLowerCase().includes(term);
        const bankMatch = b.bankName?.toLowerCase().includes(term);
        const ifscMatch = b.ifscCode?.toLowerCase().includes(term);
        const custMatch = b.customer?.name?.toLowerCase().includes(term);
        if (!nameMatch && !accMatch && !bankMatch && !ifscMatch && !custMatch) return false;
      }
      return true;
    });
  }, [beneficiaries, statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="view-card skeleton-container">
        <div className="skeleton-title" style={{ width: "240px" }}></div>
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

      {/* FILTERS */}
      <div className="view-card filter-bar-card">
        <div className="filters-grid">
          <div className="filter-group filter-search" style={{ flex: 1 }}>
            <label htmlFor="admin-search-ben">Search Beneficiaries</label>
            <input
              id="admin-search-ben"
              type="text"
              placeholder="Search by payee name, account no, bank, IFSC, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="admin-ben-status">Status</label>
            <select
              id="admin-ben-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses ({beneficiaries.length})</option>
              <option value="ACTIVE">ACTIVE Only</option>
              <option value="INACTIVE">INACTIVE Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="view-card">
        {filteredBeneficiaries.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📋</div>
            <h3>No Beneficiaries Found</h3>
            <p>
              {beneficiaries.length === 0
                ? "No transfer payees registered yet in the system."
                : "No payees matched the search criteria."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Payee Name</th>
                  <th>Linked Customer</th>
                  <th>Account No</th>
                  <th>Bank Name</th>
                  <th>IFSC Code</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaries.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span className="font-bold text-main">{b.name}</span>
                    </td>
                    <td>
                      <span className="font-semibold">{b.customer?.name || `Customer #${b.customer?.id || "N/A"}`}</span>
                    </td>
                    <td className="font-mono font-semibold">{b.accountNumber}</td>
                    <td>{b.bankName}</td>
                    <td className="font-mono">{b.ifscCode}</td>
                    <td>
                      <span className={`status-pill ${b.status?.toUpperCase() === "ACTIVE" ? "status-active" : "status-closed"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="text-muted-small font-mono">
                      {b.createdAt
                        ? new Date(b.createdAt).toLocaleDateString("en-IN", {
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
                          onClick={() => setViewingBen(b)}
                          title="View payee details"
                        >
                          View
                        </button>
                        <button
                          className="table-action-btn admin-edit-btn"
                          onClick={() => openEditModal(b)}
                          title="Edit payee details"
                        >
                          Edit
                        </button>
                        <button
                          className="table-action-btn admin-delete-btn"
                          onClick={() => setDeletingBen(b)}
                          title="Delete payee"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      {isAddOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Register Beneficiary</h3>
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
                  <label>Linked Customer *</label>
                  <select
                    value={addForm.customerId}
                    onChange={(e) => setAddForm({ ...addForm, customerId: Number(e.target.value) })}
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        #{c.id} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Beneficiary / Payee Name *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Account Number *</label>
                  <input
                    type="text"
                    value={addForm.accountNumber}
                    onChange={(e) => setAddForm({ ...addForm, accountNumber: e.target.value })}
                    placeholder="e.g. 501002345678"
                    pattern="[0-9]{9,18}"
                    title="Account number must contain 9 to 18 digits"
                    required
                  />
                  <small className="form-help">Must contain 9 to 18 digits</small>
                </div>
                <div className="form-group">
                  <label>Bank Name *</label>
                  <input
                    type="text"
                    value={addForm.bankName}
                    onChange={(e) => setAddForm({ ...addForm, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>IFSC Code *</label>
                  <input
                    type="text"
                    value={addForm.ifscCode}
                    onChange={(e) => setAddForm({ ...addForm, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001234"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setIsAddOpen(false)} disabled={submitting}>
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

      {/* EDIT MODAL */}
      {editingBen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Edit Beneficiary: {editingBen.name}</h3>
              <button className="modal-close" onClick={() => setEditingBen(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box error-alert">
                    <span>⚠️ {formError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label>Payee Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Account Number *</label>
                  <input
                    type="text"
                    value={editForm.accountNumber}
                    onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                    pattern="[0-9]{9,18}"
                    title="Account number must contain 9 to 18 digits"
                    required
                  />
                  <small className="form-help">Must contain 9 to 18 digits</small>
                </div>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    value={editForm.bankName}
                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input
                    type="text"
                    value={editForm.ifscCode}
                    onChange={(e) => setEditForm({ ...editForm, ifscCode: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setEditingBen(null)} disabled={submitting}>
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

      {/* VIEW MODAL */}
      {viewingBen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Beneficiary Details</h3>
              <button className="modal-close" onClick={() => setViewingBen(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-detail-row">
                <span className="detail-label">Beneficiary Name</span>
                <span className="detail-value font-bold">{viewingBen.name}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Linked Customer</span>
                <span className="detail-value font-semibold">{viewingBen.customer?.name || "N/A"}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Account Number</span>
                <span className="detail-value font-mono font-bold">{viewingBen.accountNumber}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Bank Name</span>
                <span className="detail-value">{viewingBen.bankName}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">IFSC Code</span>
                <span className="detail-value font-mono">{viewingBen.ifscCode}</span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  <span className={`status-pill ${viewingBen.status?.toUpperCase() === "ACTIVE" ? "status-active" : "status-closed"}`}>
                    {viewingBen.status}
                  </span>
                </span>
              </div>
              <div className="modal-detail-row">
                <span className="detail-label">Registration Date</span>
                <span className="detail-value font-mono text-muted-small">
                  {viewingBen.createdAt ? new Date(viewingBen.createdAt).toLocaleString("en-IN") : "N/A"}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="primary-button" onClick={() => setViewingBen(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deletingBen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Delete Beneficiary</h3>
              <button className="modal-close" onClick={() => setDeletingBen(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="checker-confirm-box">
                <div className="confirm-icon">⚠️</div>
                <h4 className="confirm-title">Delete "{deletingBen.name}"?</h4>
                <p className="confirm-text">
                  Are you sure you want to remove this payee from the directory?
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setDeletingBen(null)} disabled={submitting}>
                Cancel
              </button>
              <button type="button" className="btn-reject-confirm" onClick={handleDeleteSubmit} disabled={submitting}>
                {submitting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
