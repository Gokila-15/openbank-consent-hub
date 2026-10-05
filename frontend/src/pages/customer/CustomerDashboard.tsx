import { useEffect, useState, useCallback } from "react";
import keycloak from "../../keycloak";
import type { Customer, Account, Transaction, Beneficiary, Consent } from "../../types";
import { customerService } from "../../services/customerService";
import { accountService } from "../../services/accountService";
import { transactionService } from "../../services/transactionService";
import { beneficiaryService } from "../../services/beneficiaryService";
import { consentService } from "../../services/consentService";

import DashboardOverview from "./views/DashboardOverview";
import ProfileView from "./views/ProfileView";
import AccountsView from "./views/AccountsView";
import TransactionsView from "./views/TransactionsView";
import BeneficiariesView from "./views/BeneficiariesView";
import ConsentsView from "./views/ConsentsView";

import "./CustomerDashboard.css";

type TabType =
  | "dashboard"
  | "profile"
  | "accounts"
  | "transactions"
  | "beneficiaries"
  | "consents";

function CustomerDashboard() {
  const username = keycloak.tokenParsed?.preferred_username || "customer";

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);

  // Loading states
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);
  const [loadingConsents, setLoadingConsents] = useState(false);

  // Error states
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [beneficiariesError, setBeneficiariesError] = useState<string | null>(null);
  const [consentsError, setConsentsError] = useState<string | null>(null);

  // Selected account for transaction filtering
  const [selectedAccountIdForTx, setSelectedAccountIdForTx] = useState<number | "ALL">("ALL");

  // Initial load: Fetch Customer Profile for logged-in user
  const fetchCustomer = useCallback(async () => {
    try {
      setLoadingCustomer(true);
      setCustomerError(null);
      const data = await customerService.getCurrentCustomer(username);
      setCustomer(data);
    } catch (err: unknown) {
      console.warn("Could not fetch customer from backend, using Keycloak profile token:", err);
      const token = keycloak.tokenParsed as any;
      const currentUsername = token?.preferred_username || username || "customer";
      const fullName =
        token?.name ||
        `${token?.given_name || ""} ${token?.family_name || ""}`.trim() ||
        currentUsername;
      const email = token?.email || `${currentUsername}@example.com`;
      const phone =
        token?.phone_number ||
        token?.phone ||
        token?.attributes?.phone?.[0] ||
        token?.attributes?.phone_number?.[0] ||
        "N/A";

      const fallbackCustomer: Customer = {
        id: 0,
        name: fullName,
        email: email,
        phone: phone,
        username: currentUsername,
      };
      setCustomer(fallbackCustomer);
      setCustomerError(null);
    } finally {
      setLoadingCustomer(false);
    }
  }, [username]);

  // Fetch Accounts
  const fetchAccounts = useCallback(async (customerId: number) => {
    try {
      setLoadingAccounts(true);
      setAccountsError(null);
      const data = await accountService.getAccountsByCustomer(customerId);
      setAccounts(data || []);
      return data || [];
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setAccounts([]);
        return [];
      }
      console.error("Failed to fetch accounts:", err);
      setAccountsError("Unable to load customer accounts.");
      return [];
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  // Fetch Transactions for given accounts
  const fetchTransactions = useCallback(async (accList: Account[]) => {
    try {
      setLoadingTransactions(true);
      setTransactionsError(null);
      const data = await transactionService.getTransactionsForAccounts(accList);
      setTransactions(data || []);
    } catch (err: unknown) {
      console.error("Failed to fetch transactions:", err);
      setTransactionsError("Unable to load transactions.");
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  // Fetch Beneficiaries
  const fetchBeneficiaries = useCallback(async (customerId: number) => {
    try {
      setLoadingBeneficiaries(true);
      setBeneficiariesError(null);
      const data = await beneficiaryService.getBeneficiariesByCustomer(customerId);
      setBeneficiaries(data || []);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setBeneficiaries([]);
        return;
      }
      console.error("Failed to fetch beneficiaries:", err);
      setBeneficiariesError("Unable to load beneficiaries.");
    } finally {
      setLoadingBeneficiaries(false);
    }
  }, []);

  // Fetch Consents
  const fetchConsents = useCallback(async (customerId: number) => {
    try {
      setLoadingConsents(true);
      setConsentsError(null);
      const data = await consentService.getConsentsByCustomer(customerId);
      setConsents(data || []);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setConsents([]);
        return;
      }
      console.error("Failed to fetch consents:", err);
      setConsentsError("Unable to load consents.");
    } finally {
      setLoadingConsents(false);
    }
  }, []);

  // Initial Customer Mount
  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  // When customer loads, fetch dependent resources (accounts, beneficiaries, consents)
  useEffect(() => {
    if (customer?.id) {
      fetchAccounts(customer.id).then((accs) => {
        if (accs && accs.length > 0) {
          fetchTransactions(accs);
        }
      });
      fetchBeneficiaries(customer.id);
      fetchConsents(customer.id);
    }
  }, [customer?.id, fetchAccounts, fetchTransactions, fetchBeneficiaries, fetchConsents]);

  const handleSelectAccountForTransactions = (accountId: number) => {
    setSelectedAccountIdForTx(accountId);
    setActiveTab("transactions");
  };

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab as TabType);
    setMobileMenuOpen(false);
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

        <div className="sidebar-badge">
          <span className="badge-dot"></span>
          <span>Customer Portal</span>
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
            className={`menu-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => handleNavigateTab("profile")}
          >
            <span className="menu-icon">👤</span>
            My Profile
          </button>

          <button
            className={`menu-item ${activeTab === "accounts" ? "active" : ""}`}
            onClick={() => handleNavigateTab("accounts")}
          >
            <span className="menu-icon">💳</span>
            My Accounts
          </button>

          <button
            className={`menu-item ${activeTab === "transactions" ? "active" : ""}`}
            onClick={() => {
              setSelectedAccountIdForTx("ALL");
              handleNavigateTab("transactions");
            }}
          >
            <span className="menu-icon">📈</span>
            Transactions
          </button>

          <button
            className={`menu-item ${activeTab === "beneficiaries" ? "active" : ""}`}
            onClick={() => handleNavigateTab("beneficiaries")}
          >
            <span className="menu-icon">👥</span>
            Beneficiaries
          </button>

          <button
            className={`menu-item ${activeTab === "consents" ? "active" : ""}`}
            onClick={() => handleNavigateTab("consents")}
          >
            <span className="menu-icon">🔐</span>
            My Consents
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
                {activeTab === "dashboard" && "Dashboard"}
                {activeTab === "profile" && "My Profile"}
                {activeTab === "accounts" && "My Accounts"}
                {activeTab === "transactions" && "Transactions"}
                {activeTab === "beneficiaries" && "Beneficiaries"}
                {activeTab === "consents" && "Consent Hub"}
              </h1>
              <p>Welcome back, {customer?.name || username} 👋</p>
            </div>
          </div>

          <div className="user-info">
            <span className="user-avatar">
              {(customer?.name || username)?.charAt(0).toUpperCase()}
            </span>
            <div className="user-meta">
              <span className="user-name">{customer?.name || username}</span>
              <span className="user-role">CUSTOMER</span>
            </div>
          </div>
        </header>

        {/* ACTIVE TAB VIEW CONTENT */}
        {activeTab === "dashboard" && (
          <DashboardOverview
            customer={customer}
            accounts={accounts}
            transactions={transactions}
            consents={consents}
            loadingCustomer={loadingCustomer}
            loadingAccounts={loadingAccounts}
            loadingTransactions={loadingTransactions}
            loadingConsents={loadingConsents}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === "profile" && (
          <ProfileView
            customer={customer}
            loading={loadingCustomer}
            error={customerError}
            onUpdateSuccess={(updated) => setCustomer(updated)}
            onRefresh={fetchCustomer}
          />
        )}

        {activeTab === "accounts" && (
          <AccountsView
            accounts={accounts}
            loading={loadingAccounts}
            error={accountsError}
            onRefresh={() => customer && fetchAccounts(customer.id)}
            onSelectAccountForTransactions={handleSelectAccountForTransactions}
          />
        )}

        {activeTab === "transactions" && (
          <TransactionsView
            transactions={transactions}
            accounts={accounts}
            loading={loadingTransactions}
            error={transactionsError}
            selectedAccountId={selectedAccountIdForTx}
            onSelectAccount={setSelectedAccountIdForTx}
            onRefresh={() => fetchTransactions(accounts)}
          />
        )}

        {activeTab === "beneficiaries" && (
          <BeneficiariesView
            beneficiaries={beneficiaries}
            customerId={customer?.id || 0}
            loading={loadingBeneficiaries}
            error={beneficiariesError}
            onRefresh={() => customer && fetchBeneficiaries(customer.id)}
            onBeneficiariesUpdated={() =>
              customer && fetchBeneficiaries(customer.id)
            }
          />
        )}

        {activeTab === "consents" && (
          <ConsentsView
            consents={consents}
            customerId={customer?.id || 0}
            loading={loadingConsents}
            error={consentsError}
            onRefresh={() => customer && fetchConsents(customer.id)}
            onConsentsUpdated={() => customer && fetchConsents(customer.id)}
          />
        )}
      </main>
    </div>
  );
}

export default CustomerDashboard;
