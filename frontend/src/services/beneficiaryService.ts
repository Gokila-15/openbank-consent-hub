import api from "../api/axios";
import type {
  Beneficiary,
  CreateBeneficiaryRequest,
  UpdateBeneficiaryRequest,
} from "../types";

export const beneficiaryService = {
  getBeneficiariesByCustomer: async (customerId: number): Promise<Beneficiary[]> => {
    const response = await api.get<Beneficiary[]>(
      `/api/beneficiaries/customers/${customerId}`
    );
    return response.data;
  },

  getBeneficiaryById: async (id: number): Promise<Beneficiary> => {
    const response = await api.get<Beneficiary>(`/api/beneficiaries/${id}`);
    return response.data;
  },

  createBeneficiary: async (
    data: CreateBeneficiaryRequest
  ): Promise<Beneficiary> => {
    const response = await api.post<Beneficiary>("/api/beneficiaries", data);
    return response.data;
  },

  updateBeneficiary: async (
    id: number,
    data: UpdateBeneficiaryRequest
  ): Promise<Beneficiary> => {
    const response = await api.put<Beneficiary>(`/api/beneficiaries/${id}`, data);
    return response.data;
  },
};
