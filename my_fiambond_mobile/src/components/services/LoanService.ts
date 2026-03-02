'use client';

import { API_BASE_URL } from '@/config/apiConfig';

// In React Native, use a config file or extra-constants for these
const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy"; 
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface NativeFile {
    uri: string;
    type: string;
    name: string;
}

export const LoanService = {
    /**
     * Uploads a file from the mobile device to Cloudinary.
     * React Native requires an object with uri, type, and name for FormData files.
     */
    async uploadToCloudinary(file: NativeFile): Promise<string> {
        const formData = new FormData();
        
        // React Native specifically looks for this object structure in FormData
        formData.append('file', {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.name || 'upload.jpg',
        } as any);
        
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(CLOUDINARY_API_URL, { 
            method: 'POST', 
            body: formData,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('Cloudinary Error:', errorData);
            throw new Error('Proof upload failed.');
        }

        const data = await res.json();
        return data.secure_url;
    },

    async createTransaction(data: any) {
        const res = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ...data, 
                created_at: new Date().toISOString() 
            })
        });
        if (!res.ok) throw new Error("Failed to record transaction.");
        return await res.json();
    },

    async updateLoan(loanId: string, data: any) {
        const res = await fetch(`${API_BASE_URL}/loans/${loanId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to update loan record.");
        return await res.json();
    },

    /**
     * Ensures dates are serialized correctly for JSON transport.
     * Mobile storage and Firebase Timestamps often need conversion to ISO strings.
     */
    sanitizeReceipts(receipts: any[]) {
        return (receipts || []).map((r: any) => ({
            url: r.url,
            amount: r.amount,
            recorded_at: r.recorded_at?.toDate 
                ? r.recorded_at.toDate().toISOString() 
                : (r.recorded_at instanceof Date ? r.recorded_at.toISOString() : r.recorded_at)
        }));
    }
};