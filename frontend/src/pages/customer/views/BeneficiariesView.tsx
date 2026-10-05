import { useState } from "react";
import type {
  Beneficiary,
  CreateBeneficiaryRequest,
  UpdateBeneficiaryRequest,
} from "../../../types";
import { beneficiaryService } from "../../../services/beneficiaryService";

interface BeneficiariesViewProps {
  beneficiaries: Beneficiary[];
  customerId: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onBeneficiariesUpdated: () => void;
}

export default function BeneficiariesView({
  beneficiaries,
  customerId,
  loading,
  error,
  onRefresh,
  onBeneficiariesUpdated,
}: BeneficiariesViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Form states for Add
  const [addForm, setAddForm] = useState<CreateBeneficiaryRequest>({
    customerId,
    name: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
  });

  // Form states for Edit
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

  // Validate IFSC: 4 uppercase letters, 0, 6 alphanumeric
  const validateIFSC = (ifsc: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
  // Validate Account Number: digits only
  const validateAccNum = (acc: string) => /^[0-9]+$/.test(acc);

  const openAddModal = () => {
    setAddForm({
      customerId,
      name: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
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
        customerId,
        ifscCode: ifscUpper,
      });
      setActionSuccess("Beneficiary added successfully!");
      setIsAddOpen(false);
      onBeneficiariesUpdated();
    } catch (err: unknown) {
      console.error("Failed to add beneficiary:", err);
      setFormError("Failed to add beneficiary. Please check if this account is already registered.");
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

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.name.toLowerCase().includes(term) ||
      b.bankName.toLowerCase().includes(term) ||
      b.accountNumber.toLowerCase().includes(term) ||
      b.ifscCode.toLowerCase().includes(term)
    );
  });

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
        <div>
          <h2>Beneficiaries</h2>
          <p>Manage verified payees for interbank transfers</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={onRefresh}>
            🔄 Refresh
          </button>
          <button className="primary-button" onClick={openAddModal}>
            + Add Beneficiary
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert-box success-alert">
          <span>✓ {actionSuccess}</span>
          <button className="alert-close" onClick={() => setActionSuccess(null)}>×</button>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="view-card filter-bar-card">
        <div className="filter-group" style={{ maxWidth: "400px" }}>
          <label htmlFor="search-beneficiary">Search Beneficiary</label>
          <input
            id="search-beneficiary"
            type="text"
            placeholder="Search by name, bank, or account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* BENEFICIARIES LIST / CARDS */}
      <div className="view-card">
        {filteredBeneficiaries.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">👥</div>
            <h3>No Beneficiaries Found</h3>
            <p>
              {beneficiaries.length === 0
                ? "You haven't added any beneficiaries yet. Click '+ Add Beneficiary' to add one."
                : "No beneficiaries matched your search."}
            </p>
            {beneficiaries.length === 0 && (
              <button className="primary-button" onClick={openAddModal} style={{ marginTop: "12px" }}>
                + Add First Beneficiary
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Beneficiary Name</th>
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
                      <button
                        className="table-action-btn"
                        onClick={() => openEditModal(b)}
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD BENEFICIARY MODAL */}
      {isAddOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add New Beneficiary</h3>
              <button className="modal-close" onClick={() => setIsAddOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box error-alert" style={{ marginBottom: "14px" }}>
                    <span>⚠️ {formError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="ben-name">Beneficiary Name *</label>
                  <input
                    id="ben-name"
                    type="text"
                    value={addForm.name}
                    onChange={(e) =>
                      setAddForm({ ...addForm, name: e.target.value })
                    }
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ben-acc">Account Number *</label>
                  <input
                    id="ben-acc"
                    type="text"
                    value={addForm.accountNumber}
                    onChange={(e) =>
                      setAddForm({ ...addForm, accountNumber: e.target.value })
                    }
                    placeholder="e.g. 987654321012"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ben-bank">Bank Name *</label>
                  <input
                    id="ben-bank"
                    type="text"
                    value={addForm.bankName}
                    onChange={(e) =>
                      setAddForm({ ...addForm, bankName: e.target.value })
                    }
                    placeholder="e.g. State Bank of India"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ben-ifsc">IFSC Code *</label>
                  <input
                    id="ben-ifsc"
                    type="text"
                    value={addForm.ifscCode}
                    onChange={(e) =>
                      setAddForm({ ...addForm, ifscCode: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. SBIN0001234 (11 characters)"
                    maxLength={11}
                    required
                  />
                  <small className="form-help">Format: 4 letters, '0', then 6 letters/digits</small>
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
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Beneficiary"}
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
              <h3>Edit Beneficiary</h3>
              <button
                className="modal-close"
                onClick={() => setEditingBeneficiary(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box error-alert" style={{ marginBottom: "14px" }}>
                    <span>⚠️ {formError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="edit-ben-name">Beneficiary Name *</label>
                  <input
                    id="edit-ben-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-ben-acc">Account Number *</label>
                  <input
                    id="edit-ben-acc"
                    type="text"
                    value={editForm.accountNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, accountNumber: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-ben-bank">Bank Name *</label>
                  <input
                    id="edit-ben-bank"
                    type="text"
                    value={editForm.bankName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bankName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-ben-ifsc">IFSC Code *</label>
                  <input
                    id="edit-ben-ifsc"
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
                  <label htmlFor="edit-ben-status">Status *</label>
                  <select
                    id="edit-ben-status"
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
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
