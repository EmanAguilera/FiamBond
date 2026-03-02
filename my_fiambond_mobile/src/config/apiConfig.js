"use client";

/**
 * Centralized API Configuration for Mobile
 * In React Native, ensure your production URL uses HTTPS.
 * For local development on a physical device, use your machine's local IP.
 */
export const API_BASE_URL = 'https://fiam-bond.vercel.app/api';

/**
 * Helper to build URLs consistently.
 * * @param {string} endpoint - The path starting with a forward slash (e.g., '/loans')
 * @param {Object} params - Object containing query parameters
 */
export const getApiUrl = (endpoint, params = {}) => {
    // Construct the base URL string
    const baseUrl = `${API_BASE_URL}${endpoint}`;
    
    // Use the URL standard API
    const url = new URL(baseUrl);
    
    // Automatically attach query parameters
    Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null) {
            // Convert numbers/booleans to strings for the searchParams
            url.searchParams.append(key, String(value));
        }
    });
    
    return url.toString();
};