'use client'; // Required due to the use of useState, useContext, and browser APIs (fetch, FormData, File)

import { useState, useContext, FormEvent, ChangeEvent } from 'react';
import { AppContext } from '../../../context/AppContext.jsx';
import { toast } from 'react-hot-toast'; // Client-side library

// ⭐️ Next.js change: Replace import.meta.env with process.env.NEXT_PUBLIC_
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface MakeRepaymentWidgetProps {
    loan: any;
    onSuccess: () => void;
}

export default function MakeRepaymentWidget({ loan, onSuccess }: MakeRepaymentWidgetProps) {
    const { user } = useContext(AppContext);
    // ⭐️ Next.js change: Replace import.meta.env.VITE_API_URL with process.env.NEXT_PUBLIC_API_URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const totalOwed = loan.total_owed || loan.amount;
    const outstanding = totalOwed - (loan.repaid_amount || 0);

    // State typing retained from original .tsx
    const [amount, setAmount] = useState<string>(outstanding.toFixed(2));
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Submit for Confirmation');

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Function typing retained from original .tsx
    const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachmentFile(e.target.files[0]);
        } else {
            setAttachmentFile(null);
        }
    };

    // Function typing retained from original .tsx
    const handleSubmitForConfirmation = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const repaymentAmount = parseFloat(amount);

        if (!user || !loan || !loan.id) {
            setError("Cannot process payment. Missing user or loan data.");
            return;
        }
        if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
            setError("Please enter a valid, positive amount.");
            return;
        }
        if (repaymentAmount > outstanding) {
            setError(`Payment cannot exceed the outstanding amount of ₱${outstanding.toFixed(2)}.`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let receiptUrl = null;

            // 1. Upload Receipt to Cloudinary
            if (attachmentFile) {
                setStatusMessage("Uploading receipt...");
                const uploadFormData = new FormData();
                uploadFormData.append('file', attachmentFile);
                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const response = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: uploadFormData });
                if (!response.ok) throw new Error('Failed to upload receipt.');
                
                const data = await response.json();
                receiptUrl = data.secure_url;
            }
            
            setStatusMessage("Submitting for confirmation...");

            // 2. Update Loan (PATCH) to add pending_repayment
            // We send the object structure that the backend expects
            const pendingRepaymentData = {
                amount: repaymentAmount,
                submitted_by: user.uid,
                submitted_at: new Date(),
                receipt_url: receiptUrl || null,
            };

            const loanResponse = await fetch(`${API_URL}/loans/${loan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pending_repayment: pendingRepaymentData 
                })
            });

            if (!loanResponse.ok) throw new Error("Failed to submit repayment to server.");

            // 3. Create Expense Transaction (POST)
            const transactionData = {
                user_id: user.uid,
                family_id: null,
                type: 'expense',
                amount: repaymentAmount,
                description: `Loan repayment for: ${loan.description}`,
                attachment_url: receiptUrl
            };

            const txResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txResponse.ok) throw new Error("Repayment submitted, but failed to record expense.");

            toast.success("Repayment submitted for lender confirmation!");
            onSuccess();

        } catch (err: any) {
            console.error("Failed to submit repayment:", err);
            setError("Could not submit payment. Please check your connection and try again.");
            toast.error("Failed to submit repayment.");
        } finally {
            setLoading(false);
            setStatusMessage('Submit for Confirmation');
        }
    };

    return (
        <form onSubmit={handleSubmitForConfirmation} className="space-y-4">
            <div>
                <p className="text-sm text-gray-600">You are making a repayment for:</p>
                <p className="font-semibold text-gray-800">{loan.description}</p>
                <p className="text-lg font-bold text-rose-600 mt-2">
                    Outstanding: ₱{outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
            <hr />
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Repayment Amount (₱)</label>
                <input 
                    id="amount" 
                    type="number" 
                    step="0.01" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    required 
                    disabled={loading} 
                    className="w-full p-2 border border-gray-300 rounded-md" 
                />
            </div>
            
            <div>
                <label htmlFor="repaymentAttachment" className="block text-sm font-medium text-gray-700">
                    Attach Proof of Payment (Optional)
                </label>
                <input 
                    id="repaymentAttachment" 
                    type="file" 
                    accept="image/*,.pdf"
                    onChange={handleAttachmentChange} 
                    disabled={loading} 
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
            </div>

            {error && <p className="error text-center text-rose-600 text-sm">{error}</p>}
            <button type="submit" className="primary-btn w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50" disabled={loading}>
                {loading ? statusMessage : 'Submit for Confirmation'}
            </button>
            <p className="text-xs text-center text-gray-500">
                This will be deducted from your personal balance. The lender must confirm this payment.
            </p>
        </form>
    );
}