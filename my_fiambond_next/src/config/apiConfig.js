"use client";

/**
 * Centralized API Configuration
 * Change the URL here to update it across all Realms (Personal, Family, Company).
 */
export const API_BASE_URL = 'https://fiam-bond.vercel.app/api';

// Helper to build URLs consistently
export const getApiUrl = (endpoint, params = {}) => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    // Automatically attach query parameters
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });
    
    return url.toString();
};