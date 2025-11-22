import { useContext, useState, ChangeEvent, FormEvent, useRef } from "react";
import { AppContext } from "../../../Context/AppContext.jsx";
// Removed Firebase Imports

// --- YOUR CLOUDINARY DETAILS ---
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// --- Interfaces ---
interface Family {
  id: string;
  family_name: string;
}

interface CreateFamilyTransactionWidgetProps {
  family: Family;
  onSuccess?: () => void;
}

interface ITransactionForm {
  description: string;
  amount: string;
  type: "expense" | "income";
}

export default function CreateFamilyTransactionWidget({ family, onSuccess }: CreateFamilyTransactionWidgetProps) {
  const { user } = useContext(AppContext);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Use Vite env variable or fallback
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const [formData, setFormData] = useState<ITransactionForm>({
    description: "",
    amount: "",
    type: "expense",
  });
  
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Save Transaction');
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setAttachmentFile(e.target.files[0]);
      } else {
          setAttachmentFile(null);
      }
  };

  const handleCreateTransaction = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
        setFormError("You must be logged in.");
        return;
    }

    setFormError(null);
    setLoading(true);

    try {
      let uploadedUrl: string | null = null;

      // 1. Upload to Cloudinary (Client-side)
      if (attachmentFile) {
        setStatusMessage("Uploading receipt...");
        const uploadFormData = new FormData();
        uploadFormData.append('file', attachmentFile);
        uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const response = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: uploadFormData });
        if (!response.ok) throw new Error('Failed to upload attachment.');
        const data = await response.json();
        uploadedUrl = data.secure_url;
      }

      setStatusMessage("Recording transactions...");

      // 2. Create FAMILY Transaction (POST to Backend)
      const familyTransactionPayload = {
        user_id: user.uid,
        family_id: family.id,
        description: formData.description,
        amount: Number(formData.amount),
        type: formData.type,
        attachment_url: uploadedUrl,
        // created_at is handled by Mongoose default
      };

      const famResponse = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(familyTransactionPayload)
      });

      if (!famResponse.ok) throw new Error("Failed to record family transaction.");

      // 3. Create PERSONAL Transaction (POST to Backend)
      // Logic: Whether family income or expense, it counts as an EXPENSE to the individual user.
      const personalDescription = formData.type === 'income' 
        ? `Family Income (${family.family_name}): ${formData.description}` 
        : `Family Expense (${family.family_name}): ${formData.description}`;

      const personalTransactionPayload = {
        user_id: user.uid,
        family_id: null, // Personal scope
        description: personalDescription,
        amount: Number(formData.amount),
        type: 'expense', // Always expense for the individual contributing
        attachment_url: uploadedUrl,
      };

      const personalResponse = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personalTransactionPayload)
      });

      if (!personalResponse.ok) throw new Error("Recorded family data, but failed to update personal balance.");

      // Success
      setFormData({ description: "", amount: "", type: "expense" });
      setAttachmentFile(null);
      formRef.current?.reset();
      
      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error('Failed to create family transaction:', err);
      setFormError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
      setStatusMessage('Save Transaction');
    }
  };

  return (
    <div className="w-full">
      <form ref={formRef} onSubmit={handleCreateTransaction} className="space-y-6">
        <div className="flex justify-center gap-8 text-gray-700">
          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="type" value="expense" checked={formData.type === "expense"} onChange={handleInputChange} className="h-4 w-4 text-indigo-600" disabled={loading}/> Expense</label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="type" value="income" checked={formData.type === "income"} onChange={handleInputChange} className="h-4 w-4 text-indigo-600" disabled={loading}/> Income</label>
        </div>
        <div>
          <input type="text" name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} className="w-full p-2 border rounded-md" disabled={loading} required/>
        </div>
        <div>
          <input type="number" name="amount" placeholder="Amount" step="0.01" value={formData.amount} onChange={handleInputChange} className="w-full p-2 border rounded-md" disabled={loading} required/>
        </div>
        <div>
            <label htmlFor="familyAttachment" className="block text-sm font-medium text-gray-700 mb-1">Add Receipt (Optional)</label>
            <input id="familyAttachment" type="file" onChange={handleFileChange} disabled={loading} accept="image/*,.pdf" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"/>
        </div>

        {formError && <p className="error text-center">{formError}</p>}
        
        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? statusMessage : 'Save Transaction'}
        </button>

        <p className="text-xs text-center text-gray-500">
            Note: Both family income and expenses will be recorded as an **expense** in your personal balance.
        </p>
      </form>
    </div>
  );
}