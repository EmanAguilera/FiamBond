import { useState, useContext, FormEvent, ChangeEvent } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import { Loan } from '../../types'; // Assumes your master Loan type is here

// --- YOUR CLOUDINARY DETAILS ---
// This should be the same configuration as your other widget.
const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy"; // Replace with your Cloud Name
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


interface MakeRepaymentWidgetProps {
    loan: Loan;
    onSuccess: () => void;
}

export default function MakeRepaymentWidget({ loan, onSuccess }: MakeRepaymentWidgetProps) {
    const { user } = useContext(AppContext);

    const totalOwed = loan.total_owed || loan.amount;
    const outstanding = totalOwed - (loan.repaid_amount || 0);

    const [amount, setAmount] = useState<string>(outstanding.toFixed(2));
    
    // --- ADD THIS --- State for the attachment file and status message
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Submit for Confirmation');

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // --- ADD THIS --- Handler for the new file input
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

            // --- ADD THIS: UPLOAD LOGIC ---
            if (attachmentFile) {
                setStatusMessage("Uploading receipt...");

                const uploadFormData = new FormData();
                uploadFormData.append('file', attachmentFile);
                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const response = await fetch(CLOUDINARY_API_URL, {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (!response.ok) {
                    throw new Error('Failed to upload receipt to Cloudinary.');
                }

                const data = await response.json();
                receiptUrl = data.secure_url;
            }
            
            setStatusMessage("Submitting for confirmation...");

            const batch = writeBatch(db);
            const loanRef = doc(db, "loans", loan.id);
            
            // --- UPDATE THIS: Add the receipt URL to the pending_repayment object ---
            const pendingRepaymentData = {
                amount: repaymentAmount,
                submitted_by: user.uid,
                submitted_at: serverTimestamp(),
                ...(receiptUrl && { receipt_url: receiptUrl }), // Conditionally add the URL
            };

            batch.update(loanRef, { pending_repayment: pendingRepaymentData });

            const transactionRef = doc(collection(db, "transactions"));
            const transactionData = {
                user_id: user.uid,
                family_id: null,
                type: 'expense',
                amount: repaymentAmount,
                description: `Loan repayment for: ${loan.description}`,
                created_at: serverTimestamp()
            };
            batch.set(transactionRef, transactionData);

            await batch.commit();
            onSuccess();

        } catch (err: any) {
            console.error("Failed to submit repayment for confirmation:", err);
            setError("Could not submit payment. Please check your connection and try again.");
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
                <p className="text-lg font-bold text-red-600 mt-2">
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
            
            {/* --- ADD THIS: The new file input for the repayment receipt --- */}
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

            {error && <p className="error">{error}</p>}
            <button type="submit" className="primary-btn w-full" disabled={loading}>
                {loading ? statusMessage : 'Submit for Confirmation'}
            </button>
            <p className="text-xs text-center text-gray-500">
                This will be deducted from your personal balance. The lender must confirm this payment.
            </p>
        </form>
    );
}