import { useState, useContext, FormEvent, ChangeEvent } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
// FIX: Add `serverTimestamp` back to the import list
import { doc, writeBatch, collection, increment, Timestamp, serverTimestamp } from 'firebase/firestore'; 
import { Loan } from '../../types';

// --- YOUR CLOUDINARY DETAILS ---
const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy"; // Replace with your Cloud Name
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface RecordPersonalRepaymentWidgetProps {
    loan: Loan;
    onSuccess: () => void;
}

export default function RecordPersonalRepaymentWidget({ loan, onSuccess }: RecordPersonalRepaymentWidgetProps) {
    const { user } = useContext(AppContext);
    
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
            
            const batch = writeBatch(db);
            const loanRef = doc(db, "loans", loan.id);
            const newRepaidAmount = (loan.repaid_amount || 0) + repaymentAmount;
            const newStatus = newRepaidAmount >= totalOwed ? "repaid" : "outstanding";

            const loanUpdateData: { [key: string]: any } = {
                repaid_amount: increment(repaymentAmount),
                status: newStatus,
            };

            if (receiptUrl) {
                const existingReceipts = loan.repayment_receipts || [];
                loanUpdateData.repayment_receipts = [...existingReceipts, {
                    url: receiptUrl,
                    amount: repaymentAmount,
                    recorded_at: Timestamp.now()
                }];
            }

            batch.update(loanRef, loanUpdateData);

            const transactionRef = doc(collection(db, "transactions"));
            const debtorName = loan.debtor?.full_name || loan.debtor_name || 'the borrower';
            const transactionData = {
                user_id: user.uid,
                family_id: null,
                type: 'income',
                amount: repaymentAmount,
                description: `Repayment received from ${debtorName} for: ${loan.description}`,
                created_at: serverTimestamp() // This now works because it's imported correctly
            };
            batch.set(transactionRef, transactionData);

            await batch.commit();
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