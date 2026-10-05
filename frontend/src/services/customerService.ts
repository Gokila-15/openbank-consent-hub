import api from "../api/axios";
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from "../types";

export const customerService = {
  getAllCustomers: async (): Promise<Customer[]> => {
    const response = await api.get<Customer[]>("/api/customers");
    return response.data;
  },

  getCustomer: async (id: number): Promise<Customer> => {
    const response = await api.get<Customer>(`/api/customers/${id}`);
    return response.data;
  },

  getCurrentCustomer: async (username?: string): Promise<Customer> => {
    try {
      const response = await api.get<Customer>("/api/customers/me");
      if (response.data && response.data.id) {
        return response.data;
      }
    } catch {
      // Fallback to /username/{username} endpoint
    }

    if (username) {
      const response = await api.get<Customer>(
        `/api/customers/username/${encodeURIComponent(username)}`
      );
      return response.data;
    }

    throw new Error("Customer profile not found");
  },

  createCustomer: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await api.post<Customer>("/api/customers", data);
    return response.data;
  },

  updateCustomer: async (
    id: number,
    data: UpdateCustomerRequest
  ): Promise<Customer> => {
    const response = await api.put<Customer>(`/api/customers/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id: number): Promise<void> => {
    await api.delete(`/api/customers/${id}`);
  },
};
