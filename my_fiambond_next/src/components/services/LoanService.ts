// src/components/loans/LoanService.ts
import { API_BASE_URL } from '../../config/apiConfig';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export const LoanService = {
    async uploadToCloudinary(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Proof upload failed.');
        const data = await res.json();
        return data.secure_url;
    },

    async createTransaction(data: any) {
        const res = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, created_at: new Date().toISOString() })
        });
        if (!res.ok) throw new Error("Failed to record transaction.");
    },

    async updateLoan(loanId: string, data: any) {
        const res = await fetch(`${API_BASE_URL}/loans/${loanId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to update loan record.");
    },

    sanitizeReceipts(receipts: any[]) {
        return (receipts || []).map((r: any) => ({
            url: r.url,
            amount: r.amount,
            recorded_at: r.recorded_at?.toDate ? r.recorded_at.toDate().toISOString() : r.recorded_at
        }));
    }
};