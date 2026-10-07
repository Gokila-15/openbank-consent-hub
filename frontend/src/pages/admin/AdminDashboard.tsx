import { useEffect, useState, useCallback } from "react";
import keycloak from "../../keycloak";
import type { Customer, Account, Transaction, Beneficiary, Consent } from "../../types";
import { customerService } from "../../services/customerService";
import { accountService } from "../../services/accountService";
import { transactionService } from "../../services/transactionService";
import { beneficiaryService } from "../../services/beneficiaryService";
import { consentService } from "../../services/consentService";

import AdminDashboardOverview from "./views/AdminDashboardOverview";
import AdminCustomersView from "./views/AdminCustomersView";
import AdminAccountsView from "./views/AdminAccountsView";
import AdminTransactionsView from "./views/AdminTransactionsView";
import AdminBeneficiariesView from "./views/AdminBeneficiariesView";
import AdminConsentsView from "./views/AdminConsentsView";
import AdminCustomerModal from "./views/AdminCustomerModal";
import AdminConsentModal from "./views/AdminConsentModal";

import "../customer/CustomerDashboard.css";
import "../checker/CheckerDashboard.css";
import "./AdminDashboard.css";

type AdminTabType =
  | "dashboard"
  | "customers"
  | "accounts"
  | "transactions"
  | "beneficiaries"
  | "consents";

export default function AdminDashboard() {
  const username = keycloak.tokenParsed?.preferred_username || "admin";

  const [activeTab, setActiveTab] = useState<AdminTabType>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success Notification
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal States
  const [customerModal, setCustomerModal] = useState<{
    customer: Customer | null;
    mode: "view" | "edit" | "delete" | "create";
  }>({
    customer: null,
    mode: "view",
  });

  const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);

  // Fetch all system resources
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [custs, accs, txs, bens, cons] = await Promise.all([
        customerService.getAllCustomers().catch((err) => {
          console.error("Failed to fetch customers:", err);
          return [] as Customer[];
        }),
        accountService.getAllAccounts().catch((err) => {
          console.error("Failed to fetch accounts:", err);
          return [] as Account[];
        }),
        transactionService.getAllTransactions().catch((err) => {
          console.error("Failed to fetch transactions:", err);
          return [] as Transaction[];
        }),
        beneficiaryService.getAllBeneficiaries().catch((err) => {
          console.error("Failed to fetch beneficiaries:", err);
          return [] as Beneficiary[];
        }),
        consentService.getAllConsents().catch((err) => {
          console.error("Failed to fetch consents:", err);
          return [] as Consent[];
        }),
      ]);

      setCustomers(custs || []);
      setAccounts(accs || []);
      setTransactions(txs || []);
      setBeneficiaries(bens || []);
      setConsents(cons || []);
    } catch (err: any) {
      console.error("Failed to load admin dataset:", err);
      if (err?.response?.status === 403) {
        setError("You are not authorized to perform this action.");
      } else if (err?.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError("Unable to connect to the OpenBank server.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab as AdminTabType);
    setMobileMenuOpen(false);
  };

  // Customer Actions
  const handleAddCustomer = () => {
    setCustomerModal({ customer: null, mode: "create" });
  };

  const handleViewCustomer = (customer: Customer) => {
    setCustomerModal({ customer, mode: "view" });
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerModal({ customer, mode: "edit" });
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerModal({ customer, mode: "delete" });
  };

  const handleCustomerUpdated = () => {
    setActionSuccess("Customer directory successfully updated.");
    fetchAllData();
  };

  // Consent Actions
  const handleReviewConsent = (consent: Consent) => {
    setSelectedConsent(consent);
  };

  const handleApproveConsent = async (consentId: number) => {
    await consentService.updateConsent(consentId, { status: "APPROVED" });
    setActionSuccess(`Consent #${consentId} approved by Admin.`);
    await fetchAllData();
  };

  const handleRejectConsent = async (consentId: number) => {
    await consentService.updateConsent(consentId, { status: "REJECTED" });
    setActionSuccess(`Consent #${consentId} rejected by Admin.`);
    await fetchAllData();
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
            background: "rgba(147, 51, 234, 0.15)",
            borderColor: "#a855f7",
            color: "#c084fc",
          }}
        >
          <span
            className="badge-dot"
            style={{ backgroundColor: "#c084fc", boxShadow: "0 0 8px #c084fc" }}
          ></span>
          <span>Admin Portal</span>
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
            className={`menu-item ${activeTab === "customers" ? "active" : ""}`}
            onClick={() => handleNavigateTab("customers")}
          >
            <span className="menu-icon">👥</span>
            Customers
          </button>

          <button
            className={`menu-item ${activeTab === "accounts" ? "active" : ""}`}
            onClick={() => handleNavigateTab("accounts")}
          >
            <span className="menu-icon">💳</span>
            Accounts
          </button>

          <button
            className={`menu-item ${activeTab === "transactions" ? "active" : ""}`}
            onClick={() => handleNavigateTab("transactions")}
          >
            <span className="menu-icon">📈</span>
            Transactions
          </button>

          <button
            className={`menu-item ${activeTab === "beneficiaries" ? "active" : ""}`}
            onClick={() => handleNavigateTab("beneficiaries")}
          >
            <span className="menu-icon">📋</span>
            Beneficiaries
          </button>

          <button
            className={`menu-item ${activeTab === "consents" ? "active" : ""}`}
            onClick={() => handleNavigateTab("consents")}
          >
            <span className="menu-icon">🔐</span>
            Consents
            {pendingCount > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  background: activeTab === "consents" ? "#ffffff" : "#f59e0b",
                  color: activeTab === "consents" ? "#0d9488" : "#ffffff",
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
                {activeTab === "dashboard" && "Central Admin Dashboard"}
                {activeTab === "customers" && "Customer Directory"}
                {activeTab === "accounts" && "Accounts Administration"}
                {activeTab === "transactions" && "Transactions Ledger"}
                {activeTab === "beneficiaries" && "Beneficiary Payees"}
                {activeTab === "consents" && "Consent Management"}
              </h1>
              <p>Welcome back, {username}</p>
            </div>
          </div>

          <div className="user-info">
            <span
              className="user-avatar"
              style={{
                background: "linear-gradient(135deg, #0f172a, #7e22ce)",
              }}
            >
              {username.charAt(0).toUpperCase()}
            </span>
            <div className="user-meta">
              <span className="user-name">{username}</span>
              <span className="user-role" style={{ color: "#7e22ce" }}>
                ADMIN
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
          <AdminDashboardOverview
            customers={customers}
            accounts={accounts}
            transactions={transactions}
            beneficiaries={beneficiaries}
            consents={consents}
            loading={loading}
            onNavigateTab={handleNavigateTab}
            onRefreshAll={fetchAllData}
            onViewCustomer={handleViewCustomer}
            onViewConsent={handleReviewConsent}
          />
        )}

        {activeTab === "customers" && (
          <AdminCustomersView
            customers={customers}
            loading={loading}
            error={error}
            onRefresh={fetchAllData}
            onAddCustomer={handleAddCustomer}
            onViewCustomer={handleViewCustomer}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}

        {activeTab === "accounts" && (
          <AdminAccountsView
            accounts={accounts}
            customers={customers}
            loading={loading}
            error={error}
            onRefresh={fetchAllData}
            onAccountsUpdated={fetchAllData}
          />
        )}

        {activeTab === "transactions" && (
          <AdminTransactionsView
            transactions={transactions}
            accounts={accounts}
            loading={loading}
            error={error}
            onRefresh={fetchAllData}
            onTransactionCreated={fetchAllData}
          />
        )}

        {activeTab === "beneficiaries" && (
          <AdminBeneficiariesView
            beneficiaries={beneficiaries}
            customers={customers}
            loading={loading}
            error={error}
            onRefresh={fetchAllData}
            onBeneficiariesUpdated={fetchAllData}
          />
        )}

        {activeTab === "consents" && (
          <AdminConsentsView
            consents={consents}
            loading={loading}
            error={error}
            onRefresh={fetchAllData}
            onReviewConsent={handleReviewConsent}
          />
        )}

        {/* CUSTOMER DETAIL / EDIT / DELETE / CREATE MODAL */}
        {(customerModal.customer || customerModal.mode === "create") && (
          <AdminCustomerModal
            customer={customerModal.customer}
            mode={customerModal.mode}
            onClose={() => setCustomerModal({ customer: null, mode: "view" })}
            onCustomerUpdated={handleCustomerUpdated}
          />
        )}

        {/* CONSENT REVIEW MODAL */}
        {selectedConsent && (
          <AdminConsentModal
            consent={selectedConsent}
            currentUsername={username}
            onClose={() => setSelectedConsent(null)}
            onApprove={handleApproveConsent}
            onReject={handleRejectConsent}
          />
        )}
      </main>
    </div>
  );
}
