import { useContext, useState, FormEvent, ChangeEvent } from "react";
import { AppContext } from "../../Context/AppContext.jsx";
import { db } from "../../config/firebase-config.js";
import { collection, doc, writeBatch, serverTimestamp, Timestamp } from "firebase/firestore";

// --- YOUR CLOUDINARY DETAILS ---
const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy"; // Replace with your Cloud Name
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface CreatePersonalLoanWidgetProps {
    onSuccess: () => void;
}

export default function CreatePersonalLoanWidget({ onSuccess }: CreatePersonalLoanWidgetProps) {
    const { user } = useContext(AppContext);

    const [formData, setFormData] = useState({
        amount: "",
        interest_amount: "",
        description: "",
        debtorName: "", // Text input for the person's name
        deadline: "",
    });

    // --- ADD THIS: State for file and status message ---
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Confirm & Lend Money');

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    // --- ADD THIS: Handler for the file input ---
    const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachmentFile(e.target.files[0]);
        } else {
            setAttachmentFile(null);
        }
    };

    const handleLendMoney = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            setError("You must be logged in.");
            return;
        }
        setError(null);
        setLoading(true);

        try {
            let attachmentUrl = null;

            // --- ADD THIS: UPLOAD LOGIC ---
            if (attachmentFile) {
                setStatusMessage("Uploading attachment...");

                const uploadFormData = new FormData();
                uploadFormData.append('file', attachmentFile);
                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const response = await fetch(CLOUDINARY_API_URL, {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (!response.ok) {
                    throw new Error('Failed to upload attachment to Cloudinary.');
                }

                const data = await response.json();
                attachmentUrl = data.secure_url;
            }
            
            setStatusMessage("Saving loan data...");
            
            const batch = writeBatch(db);
            const newLoanRef = doc(collection(db, "loans"));
            const principal = Number(formData.amount) || 0;
            const interest = Number(formData.interest_amount) || 0;

            const loanData = {
                family_id: null,
                creditor_id: user.uid,
                debtor_id: null,
                debtor_name: formData.debtorName,
                amount: principal,
                interest_amount: interest,
                total_owed: principal + interest, 
                repaid_amount: 0,
                description: formData.description,
                deadline: formData.deadline ? Timestamp.fromDate(new Date(formData.deadline)) : null,
                status: "outstanding", // Personal loans are outstanding immediately
                created_at: serverTimestamp(),
                // --- ADD THIS: Conditionally add the URL ---
                ...(attachmentUrl && { attachment_url: attachmentUrl }),
            };
            batch.set(newLoanRef, loanData);

            const newTransactionRef = doc(collection(db, "transactions"));
            const transactionData = {
                user_id: user.uid,
                family_id: null,
                type: "expense",
                amount: principal,
                description: `Personal loan to ${formData.debtorName}: ${formData.description}`,
                created_at: serverTimestamp(),
            };
            batch.set(newTransactionRef, transactionData);

            await batch.commit();

            if (onSuccess) {
                onSuccess();
            }

        } catch (err: any) {
            console.error("Failed to record personal loan:", err);
            setError("Failed to record the loan. Please try again.");
        } finally {
            setLoading(false);
            setStatusMessage('Confirm & Lend Money');
        }
    };

    return (
        <form onSubmit={handleLendMoney} className="space-y-4">
            <div>
                <label htmlFor="debtorName" className="block text-sm font-medium text-gray-700">Lending To (Full Name):</label>
                <input id="debtorName" type="text" placeholder="e.g., John Doe" value={formData.debtorName} onChange={handleInputChange} required disabled={loading} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Loan Amount (Principal, ₱)</label>
                <input id="amount" type="number" step="0.01" placeholder="100.00" value={formData.amount} onChange={handleInputChange} required disabled={loading} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
                <label htmlFor="interest_amount" className="block text-sm font-medium text-gray-700">Interest Amount (Optional, ₱)</label>
                <input id="interest_amount" type="number" step="0.01" placeholder="10.00" value={formData.interest_amount} onChange={handleInputChange} disabled={loading} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Reason / Description</label>
                <input id="description" type="text" placeholder="e.g., Lunch money" value={formData.description} onChange={handleInputChange} required disabled={loading} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">Repayment Deadline (Optional)</label>
                <input id="deadline" type="date" value={formData.deadline} onChange={handleInputChange} disabled={loading} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>

            {/* --- ADD THIS: The new file input --- */}
            <div>
                <label htmlFor="attachment" className="block text-sm font-medium text-gray-700">Attachment (Optional)</label>
                <input 
                    id="attachment" 
                    type="file" 
                    accept="image/*,.pdf"
                    onChange={handleAttachmentChange} 
                    disabled={loading} 
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
            </div>

            {error && <p className="error text-center">{error}</p>}
            
            <button type="submit" className="primary-btn w-full" disabled={loading}>
                {loading ? statusMessage : 'Confirm & Lend Money'}
            </button>
        </form>
    );
}