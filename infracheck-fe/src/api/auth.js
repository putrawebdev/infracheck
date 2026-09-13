import api from './axios';

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch {
    return { message: 'Logged out successfully' };
  }
};

export const getAuthUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

