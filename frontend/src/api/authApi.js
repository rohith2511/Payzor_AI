import api from './api';

const authApi = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  signup: async (name, org, email, password) => {
    const response = await api.post('/auth/signup', { name, org, email, password });
    return response.data;
  },
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  update: async (userData) => {
    const response = await api.put('/auth/update', userData);
    return response.data;
  },
};

export default authApi;
