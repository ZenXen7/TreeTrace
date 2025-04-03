import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error creating account');
  }
};