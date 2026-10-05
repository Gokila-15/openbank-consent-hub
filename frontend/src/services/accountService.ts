import api from "../api/axios";
import type { Account } from "../types";

export const accountService = {
  getAccountsByCustomer: async (customerId: number): Promise<Account[]> => {
    const response = await api.get<Account[]>(`/api/accounts/customer/${customerId}`);
    return response.data;
  },

  getAccountById: async (id: number): Promise<Account> => {
    const response = await api.get<Account>(`/api/accounts/${id}`);
    return response.data;
  },
};
