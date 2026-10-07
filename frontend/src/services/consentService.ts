import api from "../api/axios";
import type { Consent, CreateConsentRequest, UpdateConsentRequest } from "../types";

export const consentService = {
  getAllConsents: async (): Promise<Consent[]> => {
    const response = await api.get<Consent[]>("/consents");
    return response.data;
  },

  getConsentsByCustomer: async (customerId: number): Promise<Consent[]> => {
    const response = await api.get<Consent[]>(
      `/consents/customer/${customerId}`
    );
    return response.data;
  },

  getConsentById: async (id: number): Promise<Consent> => {
    const response = await api.get<Consent>(`/consents/${id}`);
    return response.data;
  },

  createConsent: async (data: CreateConsentRequest): Promise<Consent> => {
    const response = await api.post<Consent>("/consents", data);
    return response.data;
  },

  updateConsent: async (
    id: number,
    data: UpdateConsentRequest
  ): Promise<Consent> => {
    const response = await api.put<Consent>(`/consents/${id}`, data);
    return response.data;
  },
};
