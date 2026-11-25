import axiosClient from './axiosClient.js';

export const registerCustomer = async (data) => {
  const response = await axiosClient.post('/auth/register/customer', data);
  return response.data;
};

export const registerWholesaler = async (data) => {
  const response = await axiosClient.post('/auth/register/wholesaler', data);
  return response.data;
};

export const login = async (data) => {
  const response = await axiosClient.post('/auth/login', data);
  return response.data;
};

export const getMe = async () => {
  const response = await axiosClient.get('/auth/me');
  return response.data;
};

export const forgotPassword = async (data) => {
  const response = await axiosClient.post('/auth/forgot-password', data);
  return response.data;
};

export const verifyResetOTP = async (data) => {
  const response = await axiosClient.post('/auth/verify-otp', data);
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await axiosClient.post('/auth/reset-password', data);
  return response.data;
};
