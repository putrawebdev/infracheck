import api from './axios';

// Default categories fallback for offline/initial state
const DEFAULT_CATEGORIES = [
  {
    id: 1,
    name: 'Jalan Berlubang',
    slug: 'jalan-berlubang',
    code: 'CAT-01',
    description: 'Kerusakan pada badan jalan seperti lubang, aspal terkelupas, atau retak yang membahayakan pengendara.',
    is_active: true,
    reports_count: 0,
  },
  {
    id: 2,
    name: 'Jembatan Rusak',
    slug: 'jembatan-rusak',
    code: 'CAT-02',
    description: 'Kerusakan struktur gelagar, sambungan aspal, atau pembatas pengaman jembatan.',
    is_active: true,
    reports_count: 0,
  },
  {
    id: 3,
    name: 'Drainase & Saluran Air',
    slug: 'drainase-saluran-air',
    code: 'CAT-03',
    description: 'Saluran air tersumbat sampah, tanggul jebol, sedimentasi lumpur, atau genangan air hujan.',
    is_active: true,
    reports_count: 0,
  },
  {
    id: 4,
    name: 'Penerangan Jalan',
    slug: 'penerangan-jalan',
    code: 'CAT-04',
    description: 'Lampu Penerangan Jalan Umum (PJU) mati, tiang roboh, atau korsleting kabel listrik.',
    is_active: true,
    reports_count: 0,
  },
  {
    id: 5,
    name: 'Fasilitas Publik',
    slug: 'fasilitas-publik',
    code: 'CAT-05',
    description: 'Kerusakan halte bus, trotoar pejalan kaki, taman umum, atau rambu penunjuk jalan.',
    is_active: true,
    reports_count: 0,
  },
];

export const getCategories = async (params = {}) => {
  try {
    const response = await api.get('/categories', { params });
    const list = response?.data?.data ?? response?.data;
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
    return DEFAULT_CATEGORIES;
  } catch (error) {
    console.warn('API getCategories error, using fallback:', error?.message || error);
    return DEFAULT_CATEGORIES;
  }
};

export const getCategoryById = async (id) => {
  try {
    const response = await api.get(`/categories/${id}`);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.warn('API getCategoryById error, using fallback:', error?.message || error);
    const found = DEFAULT_CATEGORIES.find((c) => String(c.id) === String(id) || c.slug === String(id));
    return found || null;
  }
};

export const createCategory = async (categoryData) => {
  try {
    const response = await api.post('/categories', categoryData);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error('API createCategory error:', error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error('API updateCategory error:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error('API deleteCategory error:', error);
    throw error;
  }
};
