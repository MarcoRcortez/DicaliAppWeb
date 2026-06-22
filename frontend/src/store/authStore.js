import { create } from "zustand";

const useAuthStore = create((set) => ({
  token: localStorage.getItem("token") || null,
  role: localStorage.getItem("role") || null,
  userId: localStorage.getItem("userId") || null,
  email: localStorage.getItem("email") || null,
  securityConfigured: localStorage.getItem("securityConfigured") === "true",

  login: ({ token, role, userId, email, securityConfigured }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("userId", userId);
    localStorage.setItem("email", email);
    localStorage.setItem("securityConfigured", securityConfigured);
    set({ token, role, userId, email, securityConfigured });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("securityConfigured");
    set({ token: null, role: null, userId: null, email: null, securityConfigured: false });
  },

  setSecurityConfigured: (val) => {
    localStorage.setItem("securityConfigured", val);
    set({ securityConfigured: val });
  },
}));

export default useAuthStore;
