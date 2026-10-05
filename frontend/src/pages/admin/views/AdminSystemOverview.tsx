import type { Customer, Account, Transaction, Beneficiary, Consent } from "../../../types";
import keycloak from "../../../keycloak";

interface AdminSystemOverviewProps {
  customers: Customer[];
  accounts: Account[];
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  consents: Consent[];
  loading: boolean;
  onRefresh: () => void;
}

export default function AdminSystemOverview({
  customers,
  accounts,
  transactions,
  beneficiaries,
  consents,
  loading,
  onRefresh,
}: AdminSystemOverviewProps) {
  const currentUsername = keycloak.tokenParsed?.preferred_username || "admin";

  const pendingConsents = consents.filter(
    (c) => c.status?.toUpperCase() === "PENDING"
  ).length;
  const approvedConsents = consents.filter(
    (c) => c.status?.toUpperCase() === "APPROVED"
  ).length;
  const rejectedConsents = consents.filter(
    (c) => c.status?.toUpperCase() === "REJECTED"
  ).length;

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.balance ? Number(acc.balance) : 0),
    0
  );

  const activeAccounts = accounts.filter(
    (a) => a.status?.toUpperCase() === "ACTIVE"
  ).length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Construct real activity stream from recent events
  const recentActivities: Array<{ id: string; type: string; title: string; time: string; icon: string }> = [];

  // Recent consents
  consents.slice(0, 5).forEach((c) => {
    if (c.createdAt) {
      recentActivities.push({
        id: `consent-create-${c.id}`,
        type: "consent",
        title: `Consent #${c.id} (${c.purpose}) created by ${c.createdBy || "Maker"}`,
        time: c.createdAt,
        icon: "🔐",
      });
    }
    if (c.approvedAt) {
      recentActivities.push({
        id: `consent-appr-${c.id}`,
        type: "consent-approved",
        title: `Consent #${c.id} approved by ${c.approvedBy || "Checker"}`,
        time: c.approvedAt,
        icon: "✅",
      });
    }
    if (c.rejectedAt) {
      recentActivities.push({
        id: `consent-rej-${c.id}`,
        type: "consent-rejected",
        title: `Consent #${c.id} rejected by ${c.rejectedBy || "Checker"}`,
        time: c.rejectedAt,
        icon: "✕",
      });
    }
  });

  // Recent customers
  customers.slice(0, 3).forEach((cust) => {
    if (cust.createdAt) {
      recentActivities.push({
        id: `cust-${cust.id}`,
        type: "customer",
        title: `Customer "${cust.name}" registered (ID: #${cust.id})`,
        time: cust.createdAt,
        icon: "👤",
      });
    }
  });

  // Sort activity descending by timestamp
  recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="view-container">
      {/* SECTION HEADER */}
      <div className="section-header-modern">
        <div>
          <h2>System Architecture & Overview</h2>
          <p>Global metrics, data distribution, and IAM Keycloak role boundary governance</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={onRefresh}>
            🔄 Refresh System Status
          </button>
        </div>
      </div>

      {/* SYSTEM RUNTIME & AUTHENTICATION SPEC */}
      <div className="admin-system-grid">
        <section className="view-card">
          <div className="section-header">
            <div>
              <h3>💻 Platform & Runtime Environment</h3>
              <p>Deployment specification and database linkage</p>
            </div>
          </div>
          <div className="profile-details-list">
            <div className="profile-detail-item">
              <span className="detail-label">Application Name</span>
              <span className="detail-value font-bold text-main">OpenBank Consent Management System</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Frontend Framework</span>
              <span className="detail-value">React 18 + TypeScript + Vite</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Backend Engine</span>
              <span className="detail-value">Spring Boot 3 + Java (Port 8081)</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Primary Database</span>
              <span className="detail-value font-bold text-success">PostgreSQL (Connected & Active)</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">API Gateway Base URL</span>
              <span className="detail-value font-mono">http://localhost:8081</span>
            </div>
          </div>
        </section>

        <section className="view-card">
          <div className="section-header">
            <div>
              <h3>🔒 IAM Authentication & Security</h3>
              <p>OAuth2 / OIDC token authentication status</p>
            </div>
          </div>
          <div className="profile-details-list">
            <div className="profile-detail-item">
              <span className="detail-label">Identity Provider (IdP)</span>
              <span className="detail-value font-bold text-main">Keycloak IAM</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Auth Protocol</span>
              <span className="detail-value">OAuth2.0 / OpenID Connect (OIDC)</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Token Format</span>
              <span className="detail-value font-mono">JWT (RS256 Signed Bearer Token)</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Active Session User</span>
              <span className="detail-value font-mono font-bold text-main">{currentUsername}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Security Role</span>
              <span className="detail-value font-bold" style={{ color: "#7e22ce" }}>ADMIN</span>
            </div>
          </div>
        </section>
      </div>

      {/* CORE SUBSYSTEM METRICS GRID */}
      <div className="admin-system-grid">
        {/* CUSTOMERS & ACCOUNTS */}
        <section className="view-card">
          <div className="section-header">
            <div>
              <h3>👥 Customers & Accounts</h3>
              <p>Core banking client and ledger distribution</p>
            </div>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-item">
              <span className="detail-label">Registered Customers</span>
              <span className="detail-value font-bold text-main">{loading ? "..." : customers.length}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Active Bank Accounts</span>
              <span className="detail-value font-bold text-success">{loading ? "..." : `${activeAccounts} Active / ${accounts.length - activeAccounts} Closed`}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Total Liquid Volume</span>
              <span className="detail-value font-bold text-main">{loading ? "..." : formatCurrency(totalBalance)}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Registered Beneficiaries</span>
              <span className="detail-value font-mono">{loading ? "..." : beneficiaries.length} Payees</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Total Transaction Count</span>
              <span className="detail-value font-mono">{loading ? "..." : transactions.length} Ledger Records</span>
            </div>
          </div>
        </section>

        {/* CONSENT LIFECYCLE DISTRIBUTION */}
        <section className="view-card">
          <div className="section-header">
            <div>
              <h3>🔐 Consent Governance</h3>
              <p>Open Banking third-party data access grants</p>
            </div>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-item">
              <span className="detail-label">Total Consent Requests</span>
              <span className="detail-value font-bold text-main">{loading ? "..." : consents.length}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Pending Verification</span>
              <span className="detail-value" style={{ color: "#b45309", fontWeight: 700 }}>
                {loading ? "..." : pendingConsents} ({consents.length ? Math.round((pendingConsents / consents.length) * 100) : 0}%)
              </span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Approved & Active</span>
              <span className="detail-value text-success font-bold">
                {loading ? "..." : approvedConsents} ({consents.length ? Math.round((approvedConsents / consents.length) * 100) : 0}%)
              </span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Rejected / Denied</span>
              <span className="detail-value text-danger font-bold">
                {loading ? "..." : rejectedConsents} ({consents.length ? Math.round((rejectedConsents / consents.length) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* PROGRESS BAR DISTRIBUTION */}
          {consents.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", background: "#e2e8f0" }}>
                <div style={{ width: `${(approvedConsents / consents.length) * 100}%`, background: "#15803d" }} title="Approved" />
                <div style={{ width: `${(pendingConsents / consents.length) * 100}%`, background: "#f59e0b" }} title="Pending" />
                <div style={{ width: `${(rejectedConsents / consents.length) * 100}%`, background: "#dc2626" }} title="Rejected" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginTop: "6px" }}>
                <span>● Approved ({approvedConsents})</span>
                <span>● Pending ({pendingConsents})</span>
                <span>● Rejected ({rejectedConsents})</span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ROLE & ACCESS MATRIX TABLE (SECTION 14 SPEC) */}
      <section className="view-card">
        <div className="section-header">
          <div>
            <h3>📋 Role & Access Control Matrix</h3>
            <p>Formal specification of permissions enforced by Spring Security & Keycloak OAuth2</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                <th>Function / Resource Action</th>
                <th style={{ textAlign: "center" }}>CUSTOMER</th>
                <th style={{ textAlign: "center" }}>MAKER</th>
                <th style={{ textAlign: "center" }}>CHECKER</th>
                <th style={{ textAlign: "center" }}>ADMIN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>View own profile</strong></td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#64748b" }}>YES (Permitted)</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr>
                <td><strong>Edit own profile</strong></td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#64748b" }}>YES (Permitted)</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr>
                <td><strong>View all customers</strong></td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr>
                <td><strong>Create customer</strong></td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr>
                <td><strong>Edit customer</strong></td>
                <td style={{ textAlign: "center", color: "#64748b" }}>Own only</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr>
                <td><strong>Delete customer</strong></td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr>
                <td><strong>View accounts</strong></td>
                <td style={{ textAlign: "center", color: "#64748b" }}>Own only</td>
                <td style={{ textAlign: "center", color: "#64748b" }}>Operational</td>
                <td style={{ textAlign: "center", color: "#64748b" }}>Review if permitted</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>System-wide</td>
              </tr>
              <tr>
                <td><strong>Create account</strong></td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr>
                <td><strong>View transactions</strong></td>
                <td style={{ textAlign: "center", color: "#64748b" }}>Own only</td>
                <td style={{ textAlign: "center", color: "#64748b" }}>Operational</td>
                <td style={{ textAlign: "center", color: "#64748b" }}>Review if permitted</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>System-wide</td>
              </tr>
              <tr>
                <td><strong>Create beneficiary</strong></td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr>
                <td><strong>Create consent</strong></td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr>
                <td><strong>View own consents</strong></td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#64748b" }}>YES (Permitted)</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr>
                <td><strong>View pending consents</strong></td>
                <td style={{ textAlign: "center", color: "#64748b" }}>Own only</td>
                <td style={{ textAlign: "center", color: "#64748b" }}>Operational</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr>
                <td><strong>Approve consent</strong></td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr>
                <td><strong>Reject consent</strong></td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
              <tr style={{ background: "#fef2f2" }}>
                <td><strong>Approve own consent (Self-Approval)</strong></td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO (BLOCKED)</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO (BLOCKED)</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO (BLOCKED)</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO (BLOCKED)</td>
              </tr>
              <tr style={{ background: "#fef2f2" }}>
                <td><strong>Reject own consent (Self-Rejection)</strong></td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO (BLOCKED)</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO (BLOCKED)</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO (BLOCKED)</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO (BLOCKED)</td>
              </tr>
              <tr>
                <td><strong>System Overview & Audit</strong></td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>NO</td>
                <td style={{ textAlign: "center", color: "#15803d", fontWeight: 700 }}>YES</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* RECENT SYSTEM ACTIVITY STREAM */}
      {recentActivities.length > 0 && (
        <section className="view-card">
          <div className="section-header">
            <div>
              <h3>🕒 Recent System Activity</h3>
              <p>Real-time stream of recent customer registrations and consent lifecycle transitions</p>
            </div>
          </div>

          <div className="admin-activity-list">
            {recentActivities.slice(0, 6).map((act) => (
              <div key={act.id} className="admin-activity-item">
                <span className="activity-icon-badge">{act.icon}</span>
                <div className="activity-info">
                  <span className="activity-title font-semibold">{act.title}</span>
                  <span className="activity-time font-mono text-muted-small">
                    {new Date(act.time).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
