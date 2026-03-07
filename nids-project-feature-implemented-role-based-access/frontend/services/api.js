import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

export const apiService = {
    getStats: async () => {
        const response = await apiClient.get('/stats');
        return response.data;
    },

    getLiveTraffic: async () => {
        const response = await apiClient.get('/live-traffic');
        return response.data;
    },

    getAttackDistribution: async () => {
        const response = await apiClient.get('/attack-distribution');
        return response.data;
    }
};
