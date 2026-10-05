import { useEffect, useState } from "react";
import keycloak from "./keycloak";
import CustomerDashboard from "./pages/customer/CustomerDashboard";

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

      } catch (error) {
        console.error("Keycloak error:", error);
        setError("Unable to initialize authentication");
      } finally {
        setLoading(false);
      }
    };

    initializeKeycloak();
  }, []);
    console.log("Logged in:", keycloak.tokenParsed?.preferred_username);
  console.log("Roles:", keycloak.tokenParsed?.realm_access?.roles);
  console.log("ACCESS TOKEN:", keycloak.token);


  if (loading) {
    return <h2>Loading OpenBank...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  if (!authenticated) {
    return <h2>Not authenticated</h2>;
  }

  return <CustomerDashboard />;
}

export default App;