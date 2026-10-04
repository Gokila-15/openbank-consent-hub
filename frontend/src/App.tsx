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
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        if (!keycloak.token) {
          throw new Error("No access token available");
        }

        const response = await axios.get<Customer>(
          "http://localhost:8081/api/customers/8",
          {
            headers: {
              Authorization: `Bearer ${keycloak.token}`,
            },
          }
        );

        setCustomer(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch customer data");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, []);

  if (loading) {
    return <h2>Loading customer data...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  return (
    <div>
      <h1>OpenBank Consent Management System</h1>

      <p>
        Logged in as:{" "}
        <strong>{keycloak.tokenParsed?.preferred_username}</strong>
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
    </div>
  );
}

export default App;