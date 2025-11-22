import { useContext, useState, FormEvent, ChangeEvent } from "react";
import { AppContext } from "../../../Context/AppContext.jsx"; // Fixed Import Path

// --- CONFIGURATION ---
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface CreatePersonalLoanWidgetProps {
    onSuccess: () => void;
}

export default function CreatePersonalLoanWidget({ onSuccess }: CreatePersonalLoanWidgetProps) {
    const { user } = useContext(AppContext);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const [formData, setFormData] = useState({
        amount: "",
        interest_amount: "",
        description: "",
        debtorName: "",
        deadline: "",
    });

    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Confirm & Lend Money');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachmentFile(e.target.files[0]);
        } else {
            setAttachmentFile(null);
        }
    };

    const handleLendMoney = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return setError("You must be logged in.");
        
        setError(null);
        setLoading(true);

        try {
            let attachmentUrl = null;

            // 1. Upload Logic
            if (attachmentFile) {
                setStatusMessage("Uploading attachment...");
                const uploadFormData = new FormData();
                uploadFormData.append('file', attachmentFile);
                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const response = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: uploadFormData });
                if (!response.ok) throw new Error('Failed to upload attachment to Cloudinary.');
                
                const data = await response.json();
                attachmentUrl = data.secure_url;
            }
            
            setStatusMessage("Saving loan data...");
            
            const principal = Number(formData.amount) || 0;
            const interest = Number(formData.interest_amount) || 0;

            // 2. Create Personal Loan (POST)
            const loanPayload = {
                family_id: null, // Explicitly Personal
                creditor_id: user.uid,
                debtor_id: null, // External person has no system ID
                debtor_name: formData.debtorName, // Manual name entry
                amount: principal,
                interest_amount: interest,
                total_owed: principal + interest, 
                repaid_amount: 0,
                description: formData.description,
                deadline: formData.deadline ? new Date(formData.deadline) : null,
                status: "outstanding", // Auto-active (no confirmation needed for external)
                attachment_url: attachmentUrl,
            };

            const loanResponse = await fetch(`${API_URL}/loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loanPayload)
            });

            if (!loanResponse.ok) throw new Error("Failed to create loan record.");

            // 3. Create Expense Transaction (POST)
            const transactionPayload = {
                user_id: user.uid,
                family_id: null,
                type: "expense",
                amount: principal,
                description: `Personal loan to ${formData.debtorName}: ${formData.description}`,
                attachment_url: attachmentUrl,
            };

            const txResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionPayload)
            });

            if (!txResponse.ok) throw new Error("Loan recorded, but failed to save transaction.");

            if (onSuccess) onSuccess();

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