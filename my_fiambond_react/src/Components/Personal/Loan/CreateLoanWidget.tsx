import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../../../Context/AppContext.jsx"; // Fixed Import path

interface Family {
  id: string;
}

interface Member {
  id: string;
  full_name: string;
}

interface CreateLoanWidgetProps {
  family: Family;
  members: Member[];
  onSuccess?: () => void;
}

// --- CONFIGURATION ---
// Best Practice: Use .env variables, fallback to hardcoded strings only for dev
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function CreateLoanWidget({ family, members, onSuccess }: CreateLoanWidgetProps) {
  const { user } = useContext(AppContext);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const [formData, setFormData] = useState({
    amount: "",
    interest_amount: "",
    description: "",
    debtorId: "",
    deadline: "",
  });

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Confirm & Lend Money');

  // Filter out the current user safely
  const otherMembers = (members || []).filter(member => String(member.id) !== String(user?.uid));

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

      // 1. Upload Attachment
      if (attachmentFile) {
        setStatusMessage("Uploading attachment...");
        const uploadFormData = new FormData();
        uploadFormData.append('file', attachmentFile);
        uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: uploadFormData });
        if (!response.ok) throw new Error('Failed to upload file to Cloudinary.');
        const data = await response.json();
        attachmentUrl = data.secure_url;
      }

      setStatusMessage("Saving loan data...");
      const debtorName = members.find(m => String(m.id) === String(formData.debtorId))?.full_name || 'Family Member';
      const principal = Number(formData.amount) || 0;
      const interest = Number(formData.interest_amount) || 0;

      // 2. Create Loan Record
      const loanPayload = {
        family_id: family.id,
        creditor_id: user.uid,
        debtor_id: formData.debtorId,
        debtor_name: debtorName,
        amount: principal,
        interest_amount: interest,
        total_owed: principal + interest,
        repaid_amount: 0,
        description: formData.description,
        deadline: formData.deadline ? new Date(formData.deadline) : null,
        status: "pending_confirmation",
        attachment_url: attachmentUrl,
      };

      const loanResponse = await fetch(`${API_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanPayload)
      });
      
      if (!loanResponse.ok) throw new Error("Failed to create loan record.");

      // 3. Record Transaction (Expense)
      const transactionPayload = {
        user_id: user.uid,
        family_id: null, // Personal Expense
        type: "expense",
        amount: principal,
        description: `Loan to ${debtorName}: ${formData.description}`,
        attachment_url: attachmentUrl,
      };

      const txResponse = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionPayload)
      });
      
      if (!txResponse.ok) throw new Error("Loan created, but failed to record transaction.");

      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error("Failed to process loan:", err);
      setError("Failed to process the loan. Please check your network connection.");
    } finally {
      setLoading(false);
      setStatusMessage('Confirm & Lend Money');
    }
  };

  return (
    <form onSubmit={handleLendMoney} className="space-y-4 p-1">
      <div>
        <label htmlFor="debtorId" className="block text-sm font-medium text-gray-700">Lending To:</label>
        <select
          id="debtorId"
          value={formData.debtorId}
          onChange={handleInputChange}
          required
          disabled={loading || otherMembers.length === 0}
          className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">
            {otherMembers.length > 0 ? "Select a family member" : "No other members to lend to"}
          </option>
          {otherMembers.map(member => (
            <option key={member.id} value={member.id}>{member.full_name}</option>
          ))}
        </select>
        {otherMembers.length === 0 && (
            <p className="text-xs text-orange-600 mt-1">
                Tip: Go back to "Manage Members" to invite people to your family.
            </p>
        )}
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Loan Amount (Principal, ₱)</label>
        <input id="amount" type="number" step="0.01" placeholder="100.00" value={formData.amount} onChange={handleInputChange} required disabled={loading} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label htmlFor="interest_amount" className="block text-sm font-medium text-gray-700">Interest Amount (Optional, ₱)</label>
        <input id="interest_amount" type="number" step="0.01" placeholder="10.00" value={formData.interest_amount} onChange={handleInputChange} disabled={loading} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Reason / Description</label>
        <input id="description" type="text" placeholder="e.g., Lunch money" value={formData.description} onChange={handleInputChange} required disabled={loading} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">Repayment Deadline (Optional)</label>
        <input id="deadline" type="date" value={formData.deadline} onChange={handleInputChange} disabled={loading} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label htmlFor="attachment" className="block text-sm font-medium text-gray-700">Attachment (Receipt, Optional)</label>
        <input id="attachment" type="file" accept="image/*,.pdf" onChange={handleAttachmentChange} disabled={loading} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
      </div>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      <button type="submit" className="primary-btn w-full" disabled={loading || otherMembers.length === 0}>
        {loading ? statusMessage : 'Confirm & Lend Money'}
      </button>
    </form>
  );
}