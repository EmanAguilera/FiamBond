'use client';

import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { API_BASE_URL } from '../config/apiConfig';
import { toast } from 'react-hot-toast';

/**
 * useLoanEngine Hook
 * Handles all loan-related logic including file uploads and state transitions.
 * Returns a 'loading' boolean to trigger UnifiedLoadingWidget in the UI.
 */
export function useLoanEngine() {
    const { user } = useContext(AppContext);
    const [loading, setLoading] = useState(false);

    const uploadFile = async (file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', "ml_default");
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/dzcnbrgjy/image/upload`, { 
            method: 'POST', 
            body: fd 
        });
        
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return data.secure_url;
    };

    const performAction = async (actionType: 'CONFIRM_FUNDS' | 'REPAY' | 'APPROVE_PAYMENT', payload: any) => {
        if (!user) {
            toast.error("User session not found");
            return false;
        }

        setLoading(true);
        try {
            // Handle file upload if a new file is provided
            let fileUrl = payload.file ? await uploadFile(payload.file) : payload.existingUrl || null;

            switch (actionType) {
                case 'CONFIRM_FUNDS':
                    await fetch(`${API_BASE_URL}/loans/${payload.loanId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            status: "outstanding", 
                            confirmed_at: new Date().toISOString() 
                        })
                    });
                    
                    await fetch(`${API_BASE_URL}/transactions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            user_id: user.uid, 
                            type: 'income', 
                            amount: payload.amount, 
                            description: `Loan funds received: ${payload.desc}`, 
                            created_at: new Date().toISOString() 
                        })
                    });
                    toast.success("Funds confirmed");
                    break;

                case 'REPAY':
                    await fetch(`${API_BASE_URL}/loans/${payload.loanId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            pending_repayment: { 
                                amount: payload.amount, 
                                receipt_url: fileUrl, 
                                submitted_by: user.uid, 
                                submitted_at: new Date().toISOString() 
                            } 
                        })
                    });
                    
                    await fetch(`${API_BASE_URL}/transactions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            user_id: user.uid, 
                            type: 'expense', 
                            amount: payload.amount, 
                            description: `Repayment submitted: ${payload.desc}`, 
                            attachment_url: fileUrl, 
                            created_at: new Date().toISOString() 
                        })
                    });
                    toast.success("Repayment submitted");
                    break;

                case 'APPROVE_PAYMENT':
                    const newRepaid = (payload.currentRepaid || 0) + payload.amount;
                    await fetch(`${API_BASE_URL}/loans/${payload.loanId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            repaid_amount: newRepaid,
                            status: newRepaid >= (payload.totalOwed - 0.01) ? "repaid" : "outstanding",
                            pending_repayment: null,
                            repayment_receipts: [
                                ...(payload.existingReceipts || []), 
                                { url: fileUrl, amount: payload.amount, recorded_at: new Date().toISOString() }
                            ]
                        })
                    });
                    
                    await fetch(`${API_BASE_URL}/transactions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            user_id: user.uid, 
                            type: 'income', 
                            amount: payload.amount, 
                            description: `Repayment confirmed: ${payload.desc}`, 
                            attachment_url: fileUrl, 
                            created_at: new Date().toISOString() 
                        })
                    });
                    toast.success("Repayment approved");
                    break;
            }
            return true;
        } catch (e: any) {
            console.error("Loan Engine Error:", e);
            toast.error(e.message || "Process failed");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { loading, performAction };
}