import api from "../api/axios";
import type { Consent, CreateConsentRequest, UpdateConsentRequest } from "../types";

export const consentService = {
  getAllConsents: async (): Promise<Consent[]> => {
    const response = await api.get<Consent[]>("/api/consents");
    return response.data;
  },

  getConsentsByCustomer: async (customerId: number): Promise<Consent[]> => {
    const response = await api.get<Consent[]>(
      `/api/consents/customer/${customerId}`
    );
    return response.data;
  },

  getConsentById: async (id: number): Promise<Consent> => {
    const response = await api.get<Consent>(`/api/consents/${id}`);
    return response.data;
  },

  createConsent: async (data: CreateConsentRequest): Promise<Consent> => {
    const response = await api.post<Consent>("/api/consents", data);
    return response.data;
  },

  updateConsent: async (
    id: number,
    data: UpdateConsentRequest
  ): Promise<Consent> => {
    const response = await api.put<Consent>(`/api/consents/${id}`, data);
    return response.data;
  },
};
