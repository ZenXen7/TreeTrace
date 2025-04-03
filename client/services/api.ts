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
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error creating account');
  }
};

export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post('/auth/login', credentials);
    // Store the token in localStorage
    if (response.data.data.access_token) {
      localStorage.setItem('token', response.data.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data.data; // Return the data property from the response
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error logging in');
  }
};
