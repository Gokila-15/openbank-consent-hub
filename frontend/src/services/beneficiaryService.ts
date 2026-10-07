import api from "../api/axios";
import type {
  Beneficiary,
  CreateBeneficiaryRequest,
  UpdateBeneficiaryRequest,
} from "../types";

export const beneficiaryService = {
  getAllBeneficiaries: async (): Promise<Beneficiary[]> => {
    const response = await api.get<Beneficiary[]>("/beneficiaries");
    return response.data;
  },

  getBeneficiariesByCustomer: async (
    customerId: number
  ): Promise<Beneficiary[]> => {
    const response = await api.get<Beneficiary[]>(
      `/beneficiaries/customers/${customerId}`
    );
    return response.data;
  },

  getBeneficiaryById: async (id: number): Promise<Beneficiary> => {
    const response = await api.get<Beneficiary>(`/beneficiaries/${id}`);
    return response.data;
  },

  createBeneficiary: async (
    data: CreateBeneficiaryRequest
  ): Promise<Beneficiary> => {
    const response = await api.post<Beneficiary>("/beneficiaries", data);
    return response.data;
  },

  updateBeneficiary: async (
    id: number,
    data: UpdateBeneficiaryRequest
  ): Promise<Beneficiary> => {
    const response = await api.put<Beneficiary>(`/beneficiaries/${id}`, data);
    return response.data;
  },

  deleteBeneficiary: async (id: number): Promise<Beneficiary> => {
    const response = await api.delete<Beneficiary>(`/beneficiaries/${id}`);
    return response.data;
  },
};
