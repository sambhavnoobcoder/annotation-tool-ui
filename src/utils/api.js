import axios from "axios";

const api = axios.create({
  baseURL: 'https://devb2cdatamanagement.bytelearn.ai'
});

export const sendRequest = async (method, endpoint, data, headers = {}) => {
  try {
    const response = await api.request({
      method,
      url: endpoint,
      data,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      }
    });
    return response;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
};
