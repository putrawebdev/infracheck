import api from './axios';

let MOCK_ADMIN = {
  id: null,
  name: '',
  email: '',
  phone: '',
  role: '',
  avatar: '',
};

export const getAdminProfile = async () => {
  try {
    const response = await api.get('/admin/profile');
    return response.data;
  } catch (error) {
    console.warn('API getAdminProfile error, using mock:', error);
    return { data: MOCK_ADMIN, user: MOCK_ADMIN };
  }
};

export const updateAdminProfile = async (profileData) => {
  try {
    const response = await api.put('/admin/profile', profileData);
    return response.data;
  } catch (error) {
    console.warn('API updateAdminProfile error, updating mock:', error);
    MOCK_ADMIN = { ...MOCK_ADMIN, ...profileData };
    return { data: MOCK_ADMIN, message: 'Profil admin berhasil diperbarui' };
  }
};

export const updateAdminPassword = async (passwordData) => {
  try {
    const response = await api.put('/admin/password', passwordData);
    return response.data;
  } catch (error) {
    console.warn('API updateAdminPassword fallback success:', error);
    return { message: 'Password berhasil diubah (Demo Mode)' };
  }
};

