import { useEffect, useState } from "react";
import axios from "axios";
import keycloak from "./keycloak";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  username: string;
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const initializeKeycloak = async () => {
      try {
        // Initialize Keycloak first
        const isAuthenticated = await keycloak.init({
          onLoad: "login-required",
          checkLoginIframe: false,
        });

        console.log("Keycloak authenticated:", isAuthenticated);

        if (!isAuthenticated) {
          setError("Keycloak authentication failed");
          setLoading(false);
          return;
        }

        setAuthenticated(true);

        console.log(
          "Logged in user:",
          keycloak.tokenParsed?.preferred_username
        );

        console.log("Access token:", keycloak.token);

        // Now call Spring Boot API
        const response = await axios.get<Customer>(
          "http://localhost:8081/api/customers/8",
          {
            headers: {
              Authorization: `Bearer ${keycloak.token}`,
            },
          }
        );

        console.log("Customer response:", response.data);

        setCustomer(response.data);
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to fetch customer data");
      } finally {
        setLoading(false);
      }
    };

    initializeKeycloak();
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    return (
      <div>
        <h2>{error}</h2>
        <p>Check the browser console for the exact error.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>OpenBank Consent Management System</h1>

      {authenticated && (
        <>
          <p>
            Logged in as:{" "}
            <strong>
              {keycloak.tokenParsed?.preferred_username}
            </strong>
          </p>

          <p>
            Role:{" "}
            <strong>
              {keycloak.tokenParsed?.realm_access?.roles?.join(", ")}
            </strong>
          </p>

          {customer && (
            <div>
              <h2>Customer Profile</h2>

              <p>
                <strong>ID:</strong> {customer.id}
              </p>

              <p>
                <strong>Name:</strong> {customer.name}
              </p>

              <p>
                <strong>Email:</strong> {customer.email}
              </p>

              <p>
                <strong>Phone:</strong> {customer.phone}
              </p>

              <p>
                <strong>Username:</strong> {customer.username}
              </p>
            </div>
          )}

          <button onClick={() => keycloak.logout()}>
            Logout
          </button>
        </>
      )}
    </div>
  );
}

export default App;