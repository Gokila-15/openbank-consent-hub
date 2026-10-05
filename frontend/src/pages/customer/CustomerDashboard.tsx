
import { useEffect, useState } from "react";
import keycloak from "../../keycloak";
import api from "../../api/axios";
import "./CustomerDashboard.css";

function CustomerDashboard() {

  const username = keycloak.tokenParsed?.preferred_username;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchCustomer = async () => {

      try {

        const response = await api.get("/api/customers/8");

        console.log(
          "Customer API response:",
          response.data
        );

        setCustomer(response.data);

      } catch (error) {

        console.error(
          "Failed to fetch customer:",
          error
        );

      } finally {

        setLoading(false);

      }

    };

    fetchCustomer();

  }, []);

  return (
    <div className="dashboard-container">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">
          ◈ OPENBANK
        </div>

        <nav className="sidebar-menu">

          <button className="menu-item active">
            Dashboard
          </button>

          <button className="menu-item">
            My Profile
          </button>

          <button className="menu-item">
            My Accounts
          </button>

          <button className="menu-item">
            Transactions
          </button>

          <button className="menu-item">
            Beneficiaries
          </button>

          <button className="menu-item">
            My Consents
          </button>

        </nav>

        <button
          className="logout-button"
          onClick={() => keycloak.logout()}
        >
          Logout
        </button>

      </aside>


      {/* MAIN CONTENT */}

      <main className="main-content">


        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <h1>Dashboard</h1>

            <p>
              Welcome back, {username} 👋
            </p>

          </div>


          <div className="user-info">

            <span className="user-avatar">

              {username?.charAt(0).toUpperCase()}

            </span>

            <span>
              {username}
            </span>

          </div>

        </header>



        {/* CUSTOMER PROFILE */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <h2>Customer Profile</h2>

              <p>
                Your registered account information
              </p>

            </div>

          </div>


          {loading ? (

            <p>
              Loading customer information...
            </p>

          ) : customer ? (

            <div className="profile-card">

              <p>
                <strong>ID:</strong>{" "}
                {customer.id}
              </p>

              <p>
                <strong>Name:</strong>{" "}
                {customer.name}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {customer.email}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {customer.phone}
              </p>

              <p>
                <strong>Username:</strong>{" "}
                {customer.username}
              </p>

            </div>

          ) : (

            <p>
              Unable to load customer information.
            </p>

          )}

        </section>



        {/* SUMMARY CARDS */}

        <section className="summary-grid">


          <div className="summary-card">

            <p>
              Total Accounts
            </p>

            <h2>
              2
            </h2>

            <span>
              Active accounts
            </span>

          </div>



          <div className="summary-card">

            <p>
              Available Balance
            </p>

            <h2>
              ₹85,420
            </h2>

            <span>
              Across all accounts
            </span>

          </div>



          <div className="summary-card">

            <p>
              Active Consents
            </p>

            <h2>
              3
            </h2>

            <span>
              Currently active
            </span>

          </div>



          <div className="summary-card">

            <p>
              Pending Consents
            </p>

            <h2>
              1
            </h2>

            <span>
              Awaiting approval
            </span>

          </div>


        </section>



        {/* RECENT TRANSACTIONS */}

        <section className="dashboard-section">


          <div className="section-header">

            <div>

              <h2>
                Recent Transactions
              </h2>

              <p>
                Your latest account activity
              </p>

            </div>


            <button className="view-button">
              View All
            </button>

          </div>



          <div className="transaction-table">


            <div className="table-header">

              <span>
                Description
              </span>

              <span>
                Amount
              </span>

              <span>
                Status
              </span>

            </div>



            <div className="table-row">

              <span>
                Salary Credit
              </span>

              <span className="credit">
                +₹35,000
              </span>

              <span className="status approved">
                Completed
              </span>

            </div>



            <div className="table-row">

              <span>
                UPI Payment
              </span>

              <span className="debit">
                -₹2,000
              </span>

              <span className="status approved">
                Completed
              </span>

            </div>



            <div className="table-row">

              <span>
                ATM Withdrawal
              </span>

              <span className="debit">
                -₹5,000
              </span>

              <span className="status pending">
                Pending
              </span>

            </div>


          </div>


        </section>



        {/* QUICK ACTIONS */}

        <section className="dashboard-section">


          <div className="section-header">

            <div>

              <h2>
                Quick Actions
              </h2>

              <p>
                Manage your OpenBank services
              </p>

            </div>

          </div>



          <div className="quick-actions">


            <button className="action-card">

              <span>
                💳
              </span>

              <strong>
                My Accounts
              </strong>

              <small>
                View your accounts
              </small>

            </button>



            <button className="action-card">

              <span>
                📊
              </span>

              <strong>
                Transactions
              </strong>

              <small>
                View transaction history
              </small>

            </button>



            <button className="action-card">

              <span>
                👥
              </span>

              <strong>
                Beneficiaries
              </strong>

              <small>
                Manage beneficiaries
              </small>

            </button>



            <button className="action-card">

              <span>
                🔐
              </span>

              <strong>
                Consents
              </strong>

              <small>
                Manage data access
              </small>

            </button>


          </div>


        </section>


      </main>

    </div>
  );
}

export default CustomerDashboard;
