import { useEffect, useState, useCallback } from "react";
import keycloak from "../../keycloak";
import type { Consent } from "../../types";
import { consentService } from "../../services/consentService";

import CheckerDashboardOverview from "./views/CheckerDashboardOverview";
import CheckerPendingConsentsView from "./views/CheckerPendingConsentsView";
import CheckerConsentHistoryView from "./views/CheckerConsentHistoryView";
import CheckerConsentReviewModal from "./views/CheckerConsentReviewModal";

import "../customer/CustomerDashboard.css";
import "./CheckerDashboard.css";

type CheckerTabType = "dashboard" | "pending" | "history";

export default function CheckerDashboard() {
  const username = keycloak.tokenParsed?.preferred_username || "checker";

  const [activeTab, setActiveTab] = useState<CheckerTabType>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Consents data state
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review Modal State
  const [reviewConsent, setReviewConsent] = useState<Consent | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch all consents (Checker endpoint)
  const fetchConsents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await consentService.getAllConsents();
      setConsents(data || []);
    } catch (err: any) {
      console.error("Failed to fetch consents for Checker:", err);
      if (err?.response?.status === 403) {
        setError("You are not authorized to access this resource.");
      } else if (err?.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err?.response?.status >= 500) {
        setError("Unable to connect to the OpenBank server.");
      } else if (!err?.response) {
        setError("Unable to connect to the OpenBank server.");
      } else {
        setError("Failed to load consent requests from server.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab as CheckerTabType);
    setMobileMenuOpen(false);
  };

  const handleOpenReview = (consent: Consent) => {
    setReviewConsent(consent);
  };

  const handleApprove = async (consentId: number) => {
    await consentService.updateConsent(consentId, { status: "APPROVED" });
    setActionSuccess(`Consent #${consentId} has been successfully approved.`);
    await fetchConsents();
  };

  const handleReject = async (consentId: number) => {
    await consentService.updateConsent(consentId, { status: "REJECTED" });
    setActionSuccess(`Consent #${consentId} has been rejected.`);
    await fetchConsents();
  };

  const pendingCount = consents.filter(
    (c) => c.status?.toUpperCase() === "PENDING"
  ).length;

  return (
    <div className="dashboard-container">
      {/* MOBILE MENU BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="logo-container">
          <div className="logo">◈ OPENBANK</div>
          <button
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <div
          className="sidebar-badge"
          style={{
            background: "rgba(245, 158, 11, 0.15)",
            borderColor: "#f59e0b",
            color: "#f59e0b",
          }}
        >
          <span
            className="badge-dot"
            style={{ backgroundColor: "#f59e0b", boxShadow: "0 0 8px #f59e0b" }}
          ></span>
          <span>Checker Portal</span>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => handleNavigateTab("dashboard")}
          >
            <span className="menu-icon">📊</span>
            Dashboard
          </button>

          <button
            className={`menu-item ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => handleNavigateTab("pending")}
          >
            <span className="menu-icon">⏳</span>
            Pending Consents
            {pendingCount > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  background: activeTab === "pending" ? "#ffffff" : "#f59e0b",
                  color: activeTab === "pending" ? "#0d9488" : "#ffffff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "10px",
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>

          <button
            className={`menu-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => handleNavigateTab("history")}
          >
            <span className="menu-icon">📜</span>
            Consent History
          </button>
        </nav>

        <button className="logout-button" onClick={() => keycloak.logout()}>
          <span className="menu-icon">🚪</span>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="header-left">
            <button
              className="mobile-hamburger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <div>
              <h1>
                {activeTab === "dashboard" && "Checker Dashboard"}
                {activeTab === "pending" && "Pending Consents"}
                {activeTab === "history" && "Consent History"}
              </h1>
              <p>Welcome back, {username}</p>
            </div>
          </div>

          <div className="user-info">
            <span
              className="user-avatar"
              style={{
                background: "linear-gradient(135deg, #0f172a, #f59e0b)",
              }}
            >
              {username.charAt(0).toUpperCase()}
            </span>
            <div className="user-meta">
              <span className="user-name">{username}</span>
              <span className="user-role" style={{ color: "#d97706" }}>
                CHECKER
              </span>
            </div>
          </div>
        </header>

        {/* NOTIFICATION FEEDBACK */}
        {actionSuccess && (
          <div className="alert-box success-alert" style={{ marginBottom: "20px" }}>
            <span>✓ {actionSuccess}</span>
            <button
              className="alert-close"
              onClick={() => setActionSuccess(null)}
              aria-label="Dismiss alert"
            >
              ×
            </button>
          </div>
        )}

        {/* ACTIVE TAB VIEWS */}
        {activeTab === "dashboard" && (
          <CheckerDashboardOverview
            consents={consents}
            loading={loading}
            error={error}
            onNavigateTab={handleNavigateTab}
            onRefresh={fetchConsents}
            onReviewConsent={handleOpenReview}
          />
        )}

        {activeTab === "pending" && (
          <CheckerPendingConsentsView
            consents={consents}
            loading={loading}
            error={error}
            onRefresh={fetchConsents}
            onReviewConsent={handleOpenReview}
          />
        )}

        {activeTab === "history" && (
          <CheckerConsentHistoryView
            consents={consents}
            loading={loading}
            error={error}
            onRefresh={fetchConsents}
            onViewDetails={handleOpenReview}
          />
        )}

        {/* REVIEW MODAL */}
        {reviewConsent && (
          <CheckerConsentReviewModal
            consent={reviewConsent}
            currentUsername={username}
            onClose={() => setReviewConsent(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </main>
    </div>
  );
}
