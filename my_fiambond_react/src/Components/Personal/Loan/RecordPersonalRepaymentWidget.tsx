import { useState, useContext, FormEvent, ChangeEvent } from 'react';
import { AppContext } from '../../../Context/AppContext.jsx';
// Removed Firebase Imports
// import { Loan } from '../../types';

// --- YOUR CLOUDINARY DETAILS ---
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface RecordPersonalRepaymentWidgetProps {
    loan: any; // using any to allow for flexible MongoDB _id/id handling
    onSuccess: () => void;
}

export default function RecordPersonalRepaymentWidget({ loan, onSuccess }: RecordPersonalRepaymentWidgetProps) {
    const { user } = useContext(AppContext);
    // Use Vite env variable for API URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    
    const totalOwed = loan.total_owed || loan.amount;
    const outstanding = totalOwed - (loan.repaid_amount || 0);

    const [amount, setAmount] = useState<string>(outstanding.toFixed(2));
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Record Repayment Received');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachmentFile(e.target.files[0]);
        }
    };

    const handleRecordRepayment = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const repaymentAmount = parseFloat(amount);

        if (!user) { setError("You must be logged in."); return; }
        if (isNaN(repaymentAmount) || repaymentAmount <= 0) { setError("Please enter a valid amount."); return; }
        if (repaymentAmount > outstanding) { setError(`Amount cannot exceed the outstanding balance of ₱${outstanding.toFixed(2)}.`); return; }

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
                const response = await fetch(CLOUDINARY_API_URL, {
                    method: 'POST',
                    body: uploadFormData,
                });
                if (!response.ok) throw new Error('Failed to upload receipt.');
                const data = await response.json();
                receiptUrl = data.secure_url;
            }

            setStatusMessage("Recording payment...");
            
            // 2. Calculate Updates (Client-side logic replaced Firestore 'increment')
            const currentRepaid = loan.repaid_amount || 0;
            const newRepaidAmount = currentRepaid + repaymentAmount;
            // Update status: if paid in full, mark as 'repaid' (or 'paid')
            const newStatus = newRepaidAmount >= totalOwed ? "repaid" : "outstanding";

            // Prepare Receipt Object
            const newReceipt = receiptUrl ? {
                url: receiptUrl,
                amount: repaymentAmount,
                recorded_at: new Date() // Use JS Date instead of Timestamp
            } : null;

            // Construct the existing receipts array + new one
            const existingReceipts = loan.repayment_receipts || [];
            const updatedReceipts = newReceipt ? [...existingReceipts, newReceipt] : existingReceipts;

            // 3. PATCH Loan (Update loan document)
            const updatePayload = {
                repaid_amount: newRepaidAmount,
                status: newStatus,
                repayment_receipts: updatedReceipts
            };

            const loanResponse = await fetch(`${API_URL}/loans/${loan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (!loanResponse.ok) throw new Error("Failed to update loan record.");

            // 4. POST Transaction (Record Income)
            const debtorName = loan.debtor?.full_name || loan.debtor_name || 'the borrower';
            const transactionData = {
                user_id: user.uid,
                family_id: null, // Personal income
                type: 'income',
                amount: repaymentAmount,
                description: `Repayment received from ${debtorName} for: ${loan.description}`,
                attachment_url: receiptUrl
                // created_at is handled by backend default
            };

            const txResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txResponse.ok) throw new Error("Loan updated, but failed to record income transaction.");

            onSuccess();

        } catch (err: any) {
            console.error("Failed to record repayment:", err);
            setError("Could not record the repayment. Please try again.");
        } finally {
            setLoading(false);
            setStatusMessage('Record Repayment Received');
        }
    };

    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'Borrower';

    return (
        <form onSubmit={handleRecordRepayment} className="space-y-4">
            <div>
                <p className="text-sm text-gray-600">You are recording a repayment received from:</p>
                <p className="font-semibold text-gray-800">{debtorDisplayName}</p>
                <p className="text-lg font-bold text-red-600 mt-2">
                    Outstanding: ₱{outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
            <hr />
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount Received (₱)</label>
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
                <label htmlFor="personalRepaymentAttachment" className="block text-sm font-medium text-gray-700">
                    Attach Proof of Receipt (Optional)
                </label>
                <input 
                    id="personalRepaymentAttachment" 
                    type="file" 
                    accept="image/*,.pdf"
                    onChange={handleAttachmentChange} 
                    disabled={loading} 
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
            </div>

            {error && <p className="error text-center">{error}</p>}
            <button type="submit" className="primary-btn w-full" disabled={loading}>
                {loading ? statusMessage : 'Record Repayment Received'}
            </button>
            <p className="text-xs text-center text-gray-500">This will be added to your personal balance as income.</p>
        </form>
    );
}