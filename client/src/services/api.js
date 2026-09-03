import axios from "axios";
import { navigate } from "./navigationService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for auto-logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem("token");
      if (token) {
        // Only clear if we actually had a session
        localStorage.clear();
        // Do NOT use window.location.href here as it causes infinite loops if /login doesn't exist
        // or if the component re-renders and re-triggers the 401.
        // Instead, let the app detect the missing token or handle it via a toast.
        console.warn("Session expired. User logged out.");
      }
    }
    return Promise.reject(error);
  },
);

export const postRequirement = (data) => api.post("/requirements", data);
export const getRequirements = () => api.get("/requirements");
export const updateRequirementStatus = (id, status) => api.patch(`/requirements/${id}`, { status });
export const deleteRequirement = (id) => api.delete(`/requirements/${id}`);
export const getSubscriptionStats = (requirementId) => api.get("/requirements/subscription-stats", { params: { requirementId } });
export const shareRequirement = (id, data) => api.post(`/requirements/${id}/share`, data);
export const triggerLeadSharingTimer = (id, data) => api.post(`/requirements/${id}/trigger-timer`, data);
export const stopLeadSharingTimer = (id) => api.post(`/requirements/${id}/stop-timer`);
export const checkRequirementExpiry = (id) => api.post(`/requirements/${id}/check-expiry`);

// Website Settings
export const getWebsiteSettings = () => api.get("/website-settings");
export const updateWebsiteSetting = (id, data) => api.patch(`/website-settings/${id}`, data);

// Seller Shared Leads
export const getMySharedLeads = () => api.get("/shared-leads/my-leads");
export const acceptSharedLead = (id) => api.post(`/shared-leads/${id}/accept`);
export const rejectSharedLead = (id) => api.post(`/shared-leads/${id}/reject`);
export const updateLeadStatus = (id, status) => api.patch(`/shared-leads/${id}/status`, { status });

export default api;
