import { useEffect, useState, useCallback } from "react";
import keycloak from "../../keycloak";
import type { Customer, Account, Transaction, Beneficiary, Consent } from "../../types";
import { customerService } from "../../services/customerService";
import { accountService } from "../../services/accountService";
import { transactionService } from "../../services/transactionService";
import { beneficiaryService } from "../../services/beneficiaryService";
import { consentService } from "../../services/consentService";

import MakerDashboardOverview from "./views/MakerDashboardOverview";
import MakerCustomersView from "./views/MakerCustomersView";
import MakerAccountsView from "./views/MakerAccountsView";
import MakerTransactionsView from "./views/MakerTransactionsView";
import MakerBeneficiariesView from "./views/MakerBeneficiariesView";
import MakerConsentsView from "./views/MakerConsentsView";

import "../customer/CustomerDashboard.css";

type MakerTabType = "dashboard" | "customers" | "accounts" | "transactions" | "beneficiaries" | "consents";

export default function MakerDashboard() {
  const username = keycloak.tokenParsed?.preferred_username || "maker1";

  const [activeTab, setActiveTab] = useState<MakerTabType>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);

  // Loading states
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);
  const [loadingConsents, setLoadingConsents] = useState(false);

  // Error states
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [beneficiariesError, setBeneficiariesError] = useState<string | null>(null);
  const [consentsError, setConsentsError] = useState<string | null>(null);

  // Filter selection passed between tabs
  const [selectedCustomerIdForAccounts, setSelectedCustomerIdForAccounts] = useState<number | "ALL">("ALL");
  const [selectedCustomerIdForConsents, setSelectedCustomerIdForConsents] = useState<number | "ALL">("ALL");

  // Fetch Customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      setCustomersError(null);
      const data = await customerService.getAllCustomers();
      setCustomers(data);
    } catch (err: unknown) {
      console.error("Failed to fetch customers:", err);
      setCustomersError("Unable to load customer directory.");
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  // Fetch Accounts
  const fetchAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true);
      setAccountsError(null);
      const data = await accountService.getAllAccounts();
      setAccounts(data);
    } catch (err: unknown) {
      console.error("Failed to fetch accounts:", err);
      setAccountsError("Unable to load accounts.");
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  // Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoadingTransactions(true);
      setTransactionsError(null);
      const data = await transactionService.getAllTransactions();
      setTransactions(data);
    } catch (err: unknown) {
      console.error("Failed to fetch transactions:", err);
      setTransactionsError("Unable to load transactions.");
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  // Fetch Beneficiaries
  const fetchBeneficiaries = useCallback(async () => {
    try {
      setLoadingBeneficiaries(true);
      setBeneficiariesError(null);
      const data = await beneficiaryService.getAllBeneficiaries();
      setBeneficiaries(data);
    } catch (err: unknown) {
      console.error("Failed to fetch beneficiaries:", err);
      setBeneficiariesError("Unable to load beneficiaries.");
    } finally {
      setLoadingBeneficiaries(false);
    }
  }, []);

  // Fetch Consents
  const fetchConsents = useCallback(async () => {
    try {
      setLoadingConsents(true);
      setConsentsError(null);
      const data = await consentService.getAllConsents();
      setConsents(data);
    } catch (err: unknown) {
      console.error("Failed to fetch consents:", err);
      setConsentsError("Unable to load consents.");
    } finally {
      setLoadingConsents(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchCustomers();
    fetchAccounts();
    fetchTransactions();
    fetchBeneficiaries();
    fetchConsents();
  }, [fetchCustomers, fetchAccounts, fetchTransactions, fetchBeneficiaries, fetchConsents]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab as MakerTabType);
    setMobileMenuOpen(false);
  };

  const handleSelectCustomerForAccounts = (customerId: number) => {
    setSelectedCustomerIdForAccounts(customerId);
    setActiveTab("accounts");
  };

  const handleSelectCustomerForConsents = (customerId: number) => {
    setSelectedCustomerIdForConsents(customerId);
    setActiveTab("consents");
  };

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
          >
            ✕
          </button>
        </div>

        <div className="sidebar-badge" style={{ background: "rgba(13, 148, 136, 0.15)", borderColor: "#0d9488" }}>
          <span className="badge-dot" style={{ backgroundColor: "#2dd4bf" }}></span>
          <span>Maker Workspace</span>
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
            onClick={() => {
              setSelectedCustomerIdForAccounts("ALL");
              handleNavigateTab("accounts");
            }}
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
            onClick={() => {
              setSelectedCustomerIdForConsents("ALL");
              handleNavigateTab("consents");
            }}
          >
            <span className="menu-icon">🔐</span>
            Consents
          </button>
        </nav>

        <button className="logout-button" onClick={() => keycloak.logout()}>
          <span className="menu-icon">🚪</span>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
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
                {activeTab === "dashboard" && "Maker Dashboard"}
                {activeTab === "customers" && "Customer Directory"}
                {activeTab === "accounts" && "Accounts Management"}
                {activeTab === "transactions" && "Transactions Operations"}
                {activeTab === "beneficiaries" && "Beneficiaries"}
                {activeTab === "consents" && "Consent Hub"}
              </h1>
              <p>Maker Operations Portal • Logged in as {username}</p>
            </div>
          </div>

          <div className="user-info">
            <span className="user-avatar" style={{ background: "linear-gradient(135deg, #0f172a, #0d9488)" }}>
              {username.charAt(0).toUpperCase()}
            </span>
            <div className="user-meta">
              <span className="user-name">{username}</span>
              <span className="user-role" style={{ color: "#0d9488" }}>MAKER ROLE</span>
            </div>
          </div>
        </header>

        {/* ACTIVE TAB VIEW CONTENT */}
        {activeTab === "dashboard" && (
          <MakerDashboardOverview
            customers={customers}
            accounts={accounts}
            beneficiaries={beneficiaries}
            consents={consents}
            loadingCustomers={loadingCustomers}
            loadingAccounts={loadingAccounts}
            loadingBeneficiaries={loadingBeneficiaries}
            loadingConsents={loadingConsents}
            onNavigateTab={handleNavigateTab}
            onRefreshAll={refreshAll}
          />
        )}

        {activeTab === "customers" && (
          <MakerCustomersView
            customers={customers}
            loading={loadingCustomers}
            error={customersError}
            onRefresh={fetchCustomers}
            onCustomersUpdated={refreshAll}
            onSelectCustomerForAccounts={handleSelectCustomerForAccounts}
            onSelectCustomerForConsents={handleSelectCustomerForConsents}
          />
        )}

        {activeTab === "accounts" && (
          <MakerAccountsView
            accounts={accounts}
            customers={customers}
            loading={loadingAccounts}
            error={accountsError}
            onRefresh={fetchAccounts}
            onAccountsUpdated={refreshAll}
            selectedCustomerId={selectedCustomerIdForAccounts}
            onSelectCustomer={setSelectedCustomerIdForAccounts}
          />
        )}

        {activeTab === "transactions" && (
          <MakerTransactionsView
            transactions={transactions}
            accounts={accounts}
            loading={loadingTransactions}
            error={transactionsError}
            onRefresh={fetchTransactions}
            onTransactionCreated={refreshAll}
          />
        )}

        {activeTab === "beneficiaries" && (
          <MakerBeneficiariesView
            beneficiaries={beneficiaries}
            customers={customers}
            loading={loadingBeneficiaries}
            error={beneficiariesError}
            onRefresh={fetchBeneficiaries}
            onBeneficiariesUpdated={refreshAll}
          />
        )}

        {activeTab === "consents" && (
          <MakerConsentsView
            consents={consents}
            customers={customers}
            loading={loadingConsents}
            error={consentsError}
            onRefresh={fetchConsents}
            onConsentsUpdated={refreshAll}
            selectedCustomerId={selectedCustomerIdForConsents}
            onSelectCustomer={setSelectedCustomerIdForConsents}
          />
        )}
      </main>
    </div>
  );
}
