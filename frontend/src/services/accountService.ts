import api from "../api/axios";
import type {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
} from "../types";

export const accountService = {
  getAllAccounts: async (): Promise<Account[]> => {
    const response = await api.get<Account[]>("/accounts");
    return response.data;
  },

  getAccountsByCustomer: async (customerId: number): Promise<Account[]> => {
    const response = await api.get<Account[]>(
      `/accounts/customer/${customerId}`
    );
    return response.data;
  },

  getAccountById: async (id: number): Promise<Account> => {
    const response = await api.get<Account>(`/accounts/${id}`);
    return response.data;
  },

  createAccount: async (data: CreateAccountRequest): Promise<Account> => {
    const response = await api.post<Account>("/accounts", data);
    return response.data;
  },

  updateAccount: async (
    id: number,
    data: UpdateAccountRequest
  ): Promise<Account> => {
    const response = await api.put<Account>(`/accounts/${id}`, data);
    return response.data;
  },

  deleteAccount: async (id: number): Promise<Account> => {
    const response = await api.delete<Account>(`/accounts/${id}`);
    return response.data;
  },
};
