'use client'; // Required due to the use of useState, useContext, and browser APIs

import { useState, useContext, FormEvent, ChangeEvent } from 'react';
import { AppContext } from '@/src/Context/AppContext';
import { API_BASE_URL } from '@/src/config/apiConfig';
import { toast } from 'react-hot-toast';

// Next.js Cloudinary Environment Variables
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface MakeRepaymentWidgetProps {
    loan: any;
    onSuccess: () => void;
}

export default function MakeRepaymentWidget({ loan, onSuccess }: MakeRepaymentWidgetProps) {
    const { user } = useContext(AppContext);

    const totalOwed = loan.total_owed || loan.amount;
    const outstanding = totalOwed - (loan.repaid_amount || 0);

    const [amount, setAmount] = useState<string>(outstanding.toFixed(2));
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Submit for Confirmation');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachmentFile(e.target.files[0]);
        } else {
            setAttachmentFile(null);
        }
    };

    const handleSubmitForConfirmation = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const repaymentAmount = parseFloat(amount);

        if (!user || !loan || !loan.id) {
            setError("Critical data is missing.");
            return;
        }
        if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
            setError("Please enter a valid amount.");
            return;
        }
        if (repaymentAmount > outstanding + 0.01) { // 0.01 buffer for float math
            setError(`Cannot exceed outstanding balance of ₱${outstanding.toLocaleString()}.`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let receiptUrl = null;

            // 1. Upload Proof to Cloudinary
            if (attachmentFile) {
                setStatusMessage("Uploading receipt...");
                const uploadFormData = new FormData();
                uploadFormData.append('file', attachmentFile);
                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const cloudRes = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: uploadFormData });
                if (!cloudRes.ok) throw new Error('Proof upload failed.');
                
                const cloudData = await cloudRes.json();
                receiptUrl = cloudData.secure_url;
            }
            
            setStatusMessage("Submitting...");

            // 2. Submit Repayment Request to Loan Object
            const pendingRepaymentData = {
                amount: repaymentAmount,
                submitted_by: user.uid,
                submitted_at: new Date().toISOString(),
                receipt_url: receiptUrl || null,
            };

            const loanRes = await fetch(`${API_BASE_URL}/loans/${loan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pending_repayment: pendingRepaymentData })
            });

            if (!loanRes.ok) throw new Error("Server failed to process repayment.");

            // 3. Create Expense Transaction
            const transactionData = {
                user_id: user.uid,
                family_id: null,
                type: 'expense',
                amount: repaymentAmount,
                description: `Loan repayment: ${loan.description}`,
                attachment_url: receiptUrl,
                created_at: new Date().toISOString()
            };

            const txRes = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txRes.ok) throw new Error("Failed to record expense transaction.");

            toast.success("Repayment submitted for confirmation!");
            onSuccess();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Submission failed.");
            toast.error("Process failed.");
        } finally {
            setLoading(false);
            setStatusMessage('Submit for Confirmation');
        }
    };

    return (
        <form onSubmit={handleSubmitForConfirmation} className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Repaying Loan</p>
                <p className="font-bold text-slate-800 text-lg leading-tight">{loan.description}</p>
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Total Outstanding:</span>
                    <span className="text-xl font-black text-rose-600">
                        ₱{outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Amount to Pay (₱)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        required 
                        disabled={loading} 
                        className="w-full p-4 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700" 
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Upload Receipt</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleAttachmentChange} 
                        disabled={loading} 
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-dashed border-slate-200 rounded-xl p-4" 
                    />
                </div>
            </div>

            {error && <p className="text-center text-rose-600 text-xs font-bold bg-rose-50 p-2 rounded-lg">{error}</p>}
            
            <button 
                type="submit" 
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50" 
                disabled={loading}
            >
                {loading && (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {loading ? statusMessage : 'Submit for Confirmation'}
            </button>
            <p className="text-[10px] text-center text-slate-400 font-medium">
                Funds will be deducted from your personal balance immediately. The lender will review and confirm this repayment to update the loan status.
            </p>
        </form>
    );
}