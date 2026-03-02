'use client';

import { useState, useContext } from 'react';
import { Alert } from 'react-native';
import { AppContext } from '@/context/AppContext';
import { API_BASE_URL } from '@/config/apiConfig';

// Define the shape of your context (adjust fields to match your actual AppContext)
interface AppContextType {
    user: {
        uid: string;
        // add other user properties here
    } | null;
}

export function useLoanEngine() {
    // Cast the context to your interface to bypass the 'never' error
    const context = useContext(AppContext) as AppContextType | null;
    
    const user = context?.user;
    const [loading, setLoading] = useState(false);

    const uploadFile = async (fileUri: string) => {
        const fd = new FormData();
        
        // @ts-ignore
        fd.append('file', {
            uri: fileUri,
            type: 'image/jpeg',
            name: 'upload.jpg',
        });
        fd.append('upload_preset', "ml_default");
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/dzcnbrgjy/image/upload`, { 
            method: 'POST', 
            body: fd,
        });
        
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return data.secure_url;
    };

    const performAction = async (actionType: 'CONFIRM_FUNDS' | 'REPAY' | 'APPROVE_PAYMENT', payload: any) => {
        if (!user) {
            Alert.alert("Error", "User session not found");
            return false;
        }

        setLoading(true);
        try {
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
                    Alert.alert("Success", "Funds confirmed");
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
                    Alert.alert("Success", "Repayment submitted");
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
                    Alert.alert("Success", "Repayment approved");
                    break;
            }
            return true;
        } catch (e: any) {
            console.error("Loan Engine Error:", e);
            Alert.alert("Process Failed", e.message || "An unexpected error occurred");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { loading, performAction };
}