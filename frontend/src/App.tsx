import { useEffect, useState } from "react";
import keycloak from "./keycloak";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import MakerDashboard from "./pages/maker/MakerDashboard";
import CheckerDashboard from "./pages/checker/CheckerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

function App() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initializeKeycloak = async () => {
      try {
        const isAuthenticated = await keycloak.init({
          onLoad: "login-required",
          checkLoginIframe: false,
        });

        if (!isAuthenticated) {
          setError("Authentication failed");
          return;
        }

        setAuthenticated(true);

        console.log(
          "Logged in:",
          keycloak.tokenParsed?.preferred_username
        );

        console.log(
          "Roles:",
          keycloak.tokenParsed?.realm_access?.roles
        );
      } catch (err) {
        console.error("Keycloak error:", err);
        setError("Unable to initialize authentication");
      } finally {
        setLoading(false);
      }
    };

    initializeKeycloak();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <h2>Loading OpenBank...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <h2>{error}</h2>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: "16px", padding: "8px 16px", background: "#0D9488", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <h2>Not authenticated</h2>
      </div>
    );
  }

  // Determine user role
  const realmRoles: string[] = keycloak.tokenParsed?.realm_access?.roles || [];
  const resourceRoles: string[] = Object.values(
    (keycloak.tokenParsed?.resource_access as Record<string, { roles?: string[] }>) || {}
  ).flatMap((r) => r.roles || []);
  const allRoles = [...realmRoles, ...resourceRoles];

  const isAdmin = allRoles.includes("ADMIN") || allRoles.includes("ROLE_ADMIN");
  const isMaker = allRoles.includes("MAKER") || allRoles.includes("ROLE_MAKER");
  const isChecker = allRoles.includes("CHECKER") || allRoles.includes("ROLE_CHECKER");
  const isCustomer = allRoles.includes("CUSTOMER") || allRoles.includes("ROLE_CUSTOMER");

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isMaker) {
    return <MakerDashboard />;
  }

  if (isChecker) {
    return <CheckerDashboard />;
  }

  if (isCustomer) {
    return <CustomerDashboard />;
  }

  // Fallback for other roles or unassigned roles
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif", padding: "20px" }}>
      <h2>Welcome to OpenBank, {keycloak.tokenParsed?.preferred_username}</h2>
      <p style={{ color: "#64748b", marginTop: "8px" }}>
        Detected Roles: {allRoles.length > 0 ? allRoles.join(", ") : "No assigned roles"}
      </p>
      <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
        <button
          onClick={() => keycloak.logout()}
          style={{ padding: "10px 18px", background: "#0F172A", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;