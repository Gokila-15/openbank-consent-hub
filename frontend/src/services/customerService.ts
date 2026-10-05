import api from "../api/axios";
import type { Customer, UpdateCustomerRequest } from "../types";

export const customerService = {
  getCustomer: async (id: number): Promise<Customer> => {
    const response = await api.get<Customer>(`/api/customers/${id}`);
    return response.data;
  },

  updateCustomer: async (id: number, data: UpdateCustomerRequest): Promise<Customer> => {
    const response = await api.put<Customer>(`/api/customers/${id}`, data);
    return response.data;
  },
};
