import { useState } from "react";
import type { Consent } from "../../../types";

interface AdminConsentModalProps {
  consent: Consent | null;
  currentUsername: string;
  onClose: () => void;
  onApprove: (consentId: number) => Promise<void>;
  onReject: (consentId: number) => Promise<void>;
}

export default function AdminConsentModal({
  consent,
  currentUsername,
  onClose,
  onApprove,
  onReject,
}: AdminConsentModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!consent) return null;

  const isPending = consent.status?.toUpperCase() === "PENDING";
  const isCreatedByCurrentUser = consent.createdBy?.toLowerCase() === currentUsername?.toLowerCase();

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setErrorMessage(null);
    setSubmitting(true);

    try {
      if (confirmAction === "APPROVE") {
        await onApprove(consent.id);
      } else {
        await onReject(consent.id);
      }
      onClose();
    } catch (err: any) {
      console.error("Admin action error:", err);
      let msg = "An unexpected error occurred.";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.response?.status === 403) {
        msg = "You are not authorized to perform this action.";
      } else if (err?.response?.status === 404) {
        msg = "The requested consent record was not found.";
      } else if (err?.response?.status >= 500) {
        msg = "Unable to connect to the OpenBank server.";
      } else if (!err?.response) {
        msg = "Unable to connect to the OpenBank server.";
      }
      setErrorMessage(msg);
      setConfirmAction(null);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || "PENDING";
    if (s === "APPROVED") {
      return <span className="status-pill status-active"> APPROVED</span>;
    }
    if (s === "REJECTED") {
      return <span className="status-pill status-closed"> REJECTED</span>;
    }
    return <span className="status-pill status-pending"> PENDING</span>;
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="modal-box checker-review-modal">
        {/* MODAL HEADER */}
        <div className="modal-header">
          <div>
            <h3>
              {isPending ? "Admin Review: Consent Request" : "Consent Audit Details"}
            </h3>
            <p className="modal-subtitle font-mono">Reference: #{consent.id}</p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="modal-body">
          {errorMessage && (
            <div className="alert-box error-alert" style={{ marginBottom: "12px" }}>
              <span>⚠️ {errorMessage}</span>
              <button className="alert-close" onClick={() => setErrorMessage(null)}>×</button>
            </div>
          )}

          {/* CONFIRMATION OVERLAY */}
          {confirmAction ? (
            <div className="checker-confirm-box">
              <div className="confirm-icon">
                {confirmAction === "APPROVE" ? "✅" : "⚠️"}
              </div>
              <h4 className="confirm-title">
                {confirmAction === "APPROVE"
                  ? "Confirm Consent Approval (Admin)"
                  : "Confirm Consent Rejection (Admin)"}
              </h4>
              <p className="confirm-text">
                {confirmAction === "APPROVE"
                  ? `Are you sure you want to approve consent request #${consent.id} for "${consent.customer?.name || "Customer"}"? This will authorize third-party data access.`
                  : `Are you sure you want to reject consent request #${consent.id}? This will deny third-party data access.`}
              </p>

              <div className="confirm-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setConfirmAction(null)}
                  disabled={submitting}
                >
                  Back to Details
                </button>
                <button
                  type="button"
                  className={confirmAction === "APPROVE" ? "btn-approve-confirm" : "btn-reject-confirm"}
                  onClick={handleConfirmAction}
                  disabled={submitting}
                >
                  {submitting
                    ? "Processing..."
                    : confirmAction === "APPROVE"
                    ? "Yes, Approve Consent"
                    : "Yes, Reject Consent"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* MAKER METADATA */}
              <div className="maker-highlight-box">
                <div className="maker-highlight-icon">👤</div>
                <div className="maker-highlight-content">
                  <div className="maker-highlight-label">Initiator (Maker)</div>
                  <div className="maker-highlight-name font-mono">
                    Created by: <strong>{consent.createdBy || "System / Maker"}</strong>
                  </div>
                  {isCreatedByCurrentUser && (
                    <div className="self-approval-warning">
                      ⚠️ Note: You created this consent request. Self-approval is strictly forbidden under Four-Eyes policy.
                    </div>
                  )}
                </div>
              </div>

              {/* CONSENT METADATA DETAILS */}
              <div className="checker-details-list">
                <div className="modal-detail-row">
                  <span className="detail-label">Consent ID</span>
                  <span className="detail-value font-mono font-bold">#{consent.id}</span>
                </div>

                <div className="modal-detail-row">
                  <span className="detail-label">Customer</span>
                  <span className="detail-value font-semibold">
                    {consent.customer?.name || `Customer #${consent.customer?.id || "N/A"}`}
                    {consent.customer?.email && (
                      <small className="detail-sub-text"> ({consent.customer.email})</small>
                    )}
                  </span>
                </div>

                <div className="modal-detail-row">
                  <span className="detail-label">Customer ID</span>
                  <span className="detail-value font-mono">
                    {consent.customer?.id ? `#${consent.customer.id}` : "N/A"}
                  </span>
                </div>

                <div className="modal-detail-row">
                  <span className="detail-label">Current Status</span>
                  <span className="detail-value">{renderStatusBadge(consent.status)}</span>
                </div>

                <div className="modal-detail-row">
                  <span className="detail-label">Purpose</span>
                  <span className="detail-value font-semibold text-main">{consent.purpose}</span>
                </div>

                <div className="modal-detail-row">
                  <span className="detail-label">Data Access Scope</span>
                  <span className="detail-value">
                    <span className="data-scope-pill">{consent.dataAccess}</span>
                  </span>
                </div>

                <div className="modal-detail-row">
                  <span className="detail-label">Created At</span>
                  <span className="detail-value font-mono text-muted-small">
                    {consent.createdAt
                      ? new Date(consent.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "N/A"}
                  </span>
                </div>

                {consent.updatedAt && (
                  <div className="modal-detail-row">
                    <span className="detail-label">Last Updated</span>
                    <span className="detail-value font-mono text-muted-small">
                      {new Date(consent.updatedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                )}

                <div className="modal-detail-row">
                  <span className="detail-label">Expires At</span>
                  <span className="detail-value font-mono">
                    {consent.expiresAt
                      ? new Date(consent.expiresAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Open-ended (No expiry)"}
                  </span>
                </div>

                {/* APPROVED DETAILS */}
                {consent.approvedBy && (
                  <div className="modal-detail-row processed-row-approved">
                    <span className="detail-label">Approved By</span>
                    <span className="detail-value text-success font-semibold font-mono">
                      {consent.approvedBy}
                      {consent.approvedAt && (
                        <small className="detail-sub-text font-mono">
                          {" "}
                          ({new Date(consent.approvedAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })})
                        </small>
                      )}
                    </span>
                  </div>
                )}

                {/* REJECTED DETAILS */}
                {consent.rejectedBy && (
                  <div className="modal-detail-row processed-row-rejected">
                    <span className="detail-label">Rejected By</span>
                    <span className="detail-value text-danger font-semibold font-mono">
                      {consent.rejectedBy}
                      {consent.rejectedAt && (
                        <small className="detail-sub-text font-mono">
                          {" "}
                          ({new Date(consent.rejectedAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })})
                        </small>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        {!confirmAction && (
          <div className="modal-footer checker-modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={submitting}
            >
              {isPending ? "Cancel" : "Close"}
            </button>

            {isPending && (
              <div className="checker-decision-btns">
                <button
                  type="button"
                  className="btn-reject"
                  onClick={() => setConfirmAction("REJECT")}
                  disabled={submitting}
                >
                  ✕ Reject Consent
                </button>
                <button
                  type="button"
                  className="btn-approve"
                  onClick={() => setConfirmAction("APPROVE")}
                  disabled={submitting}
                >
                  ✓ Approve Consent
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
