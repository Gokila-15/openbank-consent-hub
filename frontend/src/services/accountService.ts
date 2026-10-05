import api from "../api/axios";
import type {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
} from "../types";

export const accountService = {
  getAllAccounts: async (): Promise<Account[]> => {
    const response = await api.get<Account[]>("/api/accounts");
    return response.data;
  },

  getAccountsByCustomer: async (customerId: number): Promise<Account[]> => {
    const response = await api.get<Account[]>(
      `/api/accounts/customer/${customerId}`
    );
    return response.data;
  },

  getAccountById: async (id: number): Promise<Account> => {
    const response = await api.get<Account>(`/api/accounts/${id}`);
    return response.data;
  },

  createAccount: async (data: CreateAccountRequest): Promise<Account> => {
    const response = await api.post<Account>("/api/accounts", data);
    return response.data;
  },

  updateAccount: async (
    id: number,
    data: UpdateAccountRequest
  ): Promise<Account> => {
    const response = await api.put<Account>(`/api/accounts/${id}`, data);
    return response.data;
  },

  deleteAccount: async (id: number): Promise<Account> => {
    const response = await api.delete<Account>(`/api/accounts/${id}`);
    return response.data;
  },
};
