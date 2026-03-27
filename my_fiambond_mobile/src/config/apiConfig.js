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

/**
 * --- NEW: Unified Google Auth Configuration ---
 * Used in Login.tsx and Register.tsx
 */
export const GOOGLE_AUTH_CONFIG = {
    webClientId: "818608486797-pujgl59qscfvqpek8o4m6vebnb7cbfs2.apps.googleusercontent.com",
    iosClientId: "818608486797-c2rrbocuvhu54jiiu3lnp28hn6hdlade.apps.googleusercontent.com",
    offlineAccess: true,
};

/**
 * --- NEW: Global Auth Settings ---
 * Used in VerifyEmail.tsx for the cooldown timer
 */
export const AUTH_SETTINGS = {
    emailCooldownSeconds: 60,
};