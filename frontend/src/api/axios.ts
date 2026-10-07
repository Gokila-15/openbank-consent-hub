import axios from "axios";
import keycloak from "../keycloak";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      await keycloak.updateToken(30);

      if (keycloak.token) {
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      }
    } catch (error) {
      console.error(
        "Failed to refresh Keycloak token:",
        error
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
