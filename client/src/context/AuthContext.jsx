import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMe, login as loginApi, registerCustomer as registerCustomerApi, registerWholesaler as registerWholesalerApi } from '../api/authApi.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rn_token') || null);
  const [loading, setLoading] = useState(true);

  // Check for logged in user on initial load
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const data = await getMe();
          setUser(data.user);
        } catch (error) {
          console.error("Failed to fetch user", error);
          setToken(null);
          setUser(null);
          localStorage.removeItem('rn_token');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  // Login function
  const loginUser = async (data) => {
    const response = await loginApi(data);
    localStorage.setItem('rn_token', response.token); // Note: Store in localStorage in both "remember me" and non-remember cases as a basic version
    setToken(response.token);
    setUser(response.user);
    return response.user;
  };

  // Register Customer
  const registerCustomerUser = async (data) => {
    const response = await registerCustomerApi(data);
    localStorage.setItem('rn_token', response.token);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  };

  // Register Wholesaler (Does not set token because it needs admin approval)
  const registerWholesalerUser = async (data) => {
    const response = await registerWholesalerApi(data);
    return response.message;
  };

  // Logout function
  const logoutUser = () => {
    localStorage.removeItem('rn_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, registerCustomerUser, registerWholesalerUser, logoutUser }}>
      {loading ? <div className="p-8 text-center text-[var(--brand-dark-red)] text-xl font-bold">Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
