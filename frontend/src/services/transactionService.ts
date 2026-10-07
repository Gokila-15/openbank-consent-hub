import api from "../api/axios";
import type {
  Transaction,
  Account,
  CreateTransactionRequest,
} from "../types";

export const transactionService = {
  getAllTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>("/transactions");
    return response.data;
  },

  getTransactionsByAccount: async (
    accountId: number
  ): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>(
      `/transactions/account/${accountId}`
    );
    return response.data;
  },

  getTransactionById: async (id: number): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  createTransaction: async (
    data: CreateTransactionRequest
  ): Promise<Transaction> => {
    const response = await api.post<Transaction>("/transactions", data);
    return response.data;
  },

  // Helper to fetch all transactions for all customer accounts
  getTransactionsForAccounts: async (
    accounts: Account[]
  ): Promise<Transaction[]> => {
    if (!accounts || accounts.length === 0) return [];

    const promises = accounts.map((account) =>
      transactionService
        .getTransactionsByAccount(account.id)
        .then((txs) =>
          txs.map((tx) => ({
            ...tx,
            account: tx.account || account,
          }))
        )
        .catch((err) => {
          console.error(
            `Failed to load transactions for account ${account.id}:`,
            err
          );
          return [] as Transaction[];
        })
    );

    const results = await Promise.all(promises);
    const flattened = results.flat();

    // Sort transactions by date descending (latest first)
    flattened.sort((a, b) => {
      const dateA = new Date(a.transactionDate).getTime();
      const dateB = new Date(b.transactionDate).getTime();
      return dateB - dateA;
    });

    return flattened;
  },
};
