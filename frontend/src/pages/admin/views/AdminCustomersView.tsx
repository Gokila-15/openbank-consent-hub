import { useState, useMemo } from "react";
import type { Customer } from "../../../types";

interface AdminCustomersViewProps {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onAddCustomer: () => void;
  onViewCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
}

export default function AdminCustomersView({
  customers,
  loading,
  error,
  onRefresh,
  onAddCustomer,
  onViewCustomer,
  onEditCustomer,
  onDeleteCustomer,
}: AdminCustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();

    return customers.filter((c) => {
      const idMatch = c.id?.toString().includes(term);
      const nameMatch = c.name?.toLowerCase().includes(term);
      const emailMatch = c.email?.toLowerCase().includes(term);
      const phoneMatch = c.phone?.toLowerCase().includes(term);
      const usernameMatch = c.username?.toLowerCase().includes(term);

      return idMatch || nameMatch || emailMatch || phoneMatch || usernameMatch;
    });
  }, [customers, searchTerm]);

  if (loading) {
    return (
      <div className="view-card skeleton-container">
        <div className="skeleton-title" style={{ width: "240px" }}></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <p className="loading-text">Loading customers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-card error-card">
        <h3>Unable to load customer directory</h3>
        <p>{error}</p>
        <button className="primary-button" onClick={onRefresh} style={{ marginTop: "12px" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="view-container">
      {/* SECTION HEADER */}
      <div className="section-header-modern">
       
        <div className="header-actions">
          <button className="secondary-button" onClick={onRefresh}>
            🔄 Refresh
          </button>
          <button className="primary-button" onClick={onAddCustomer}>
            + Create New Customer
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="view-card filter-bar-card">
        <div className="filters-grid">
          <div className="filter-group filter-search" style={{ flex: 1 }}>
            <label htmlFor="admin-search-customers">Search Customers</label>
            <input
              id="admin-search-customers"
              type="text"
              placeholder="Search by Customer ID, Name, Email, Phone, or Username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <button
              className="secondary-button"
              onClick={() => setSearchTerm("")}
              style={{ alignSelf: "flex-end" }}
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="view-card">
        {filteredCustomers.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">👥</div>
            <h3>
              {customers.length === 0
                ? "No customers found."
                : "No matching customers found."}
            </h3>
            <p>
              {customers.length === 0
                ? "No customer accounts are registered in the OpenBank database yet."
                : "Try adjusting your search criteria."}
            </p>
            {customers.length === 0 ? (
              <button
                className="primary-button"
                onClick={onAddCustomer}
                style={{ marginTop: "16px" }}
              >
                + Create First Customer
              </button>
            ) : (
              searchTerm && (
                <button
                  className="secondary-button"
                  onClick={() => setSearchTerm("")}
                  style={{ marginTop: "16px" }}
                >
                  Clear Search Filter
                </button>
              )
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Username</th>
                  <th>Created At</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id}>
                    <td className="font-mono font-semibold">{cust.id}</td>
                    <td>
                      <span className="font-bold text-main">{cust.name} {cust.lastName || ""}</span>
                    </td>
                    <td className="font-mono text-muted-small">{cust.email}</td>
                    <td className="font-mono">{cust.phone}</td>
                    <td>
                      {cust.username ? (
                        <span className="font-mono text-main font-semibold">{cust.username}</span>
                      ) : (
                        <span className="text-muted-small">N/A</span>
                      )}
                    </td>
                    <td className="text-muted-small font-mono">
                      {cust.createdAt
                        ? new Date(cust.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="admin-actions-cell">
                        <button
                          className="table-action-btn"
                          onClick={() => onViewCustomer(cust)}
                          title="View complete customer profile and assets"
                        >
                          View
                        </button>
                        <button
                          className="table-action-btn admin-edit-btn"
                          onClick={() => onEditCustomer(cust)}
                          title="Edit customer contact information"
                        >
                          Edit
                        </button>
                        <button
                          className="table-action-btn admin-delete-btn"
                          onClick={() => onDeleteCustomer(cust)}
                          title="Delete customer record"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
