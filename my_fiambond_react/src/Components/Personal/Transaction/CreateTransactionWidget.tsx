// Components/CreateTransactionWidget.tsx

import { useContext, useState, ChangeEvent, FormEvent, useRef } from "react";
import { AppContext } from "../../../Context/AppContext.jsx";

// --- YOUR CLOUDINARY DETAILS ---
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// --- TypeScript Interfaces ---
interface ITransactionForm {
  description: string;
  amount: string;
  type: "expense" | "income";
}

interface IGoal {
  id: string;
  name: string;
}

interface CreateTransactionWidgetProps {
  onSuccess?: () => void;
}

// --- CoinTossModal Component ---
function CoinTossModal({ goal, onAbandon, onAcknowledge }: { goal: IGoal; onAbandon: () => void; onAcknowledge: () => void; }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">A Choice Must Be Made</h2>
        <p className="mb-6 text-slate-700">
          This action conflicts with your goal: <span className="font-bold text-indigo-600">"{goal.name}"</span>.
          You have introduced a variable. You must call it.
        </p>
        <div className="space-y-4">
          <button onClick={onAbandon} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 transition-colors">
            [ Abandon Goal ]
          </button>
          <button onClick={onAcknowledge} className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-md hover:bg-slate-700 transition-colors">
            [ Acknowledge Consequence ]
          </button>
        </div>
      </div>
    </div>
  );
}


export default function CreateTransactionWidget({ onSuccess }: CreateTransactionWidgetProps) {
  const { user } = useContext(AppContext);
  const formRef = useRef<HTMLFormElement>(null);

  // Use Vite env variable or fallback to localhost
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const [formData, setFormData] = useState<ITransactionForm>({ description: "", amount: "", type: "expense" });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Save Transaction');
  
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<IGoal | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleCreateTransaction = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!user) {
        setFormError("You must be logged in.");
        return;
    }

    setFormError(null);
    setLoading(true);

    try {
      let uploadedUrl = null;

      // 1. Upload to Cloudinary (Front-end Logic)
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
            throw new Error('Failed to upload attachment.');
        }

        const data = await response.json();
        uploadedUrl = data.secure_url;
      }
      
      setStatusMessage("Saving transaction...");
      
      // 2. Send Data to Node.js Backend (POST)
      const response = await fetch(`${API_URL}/transactions`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.uid,
            family_id: null,
            description: formData.description,
            amount: Number(formData.amount),
            type: formData.type,
            attachment_url: uploadedUrl,
            // Backend handles created_at automatically
          })
      });

      if (!response.ok) {
        throw new Error("Backend failed to save transaction.");
      }
      
      // Reset Form
      setFormData({ description: "", amount: "", type: "expense" });
      setAttachmentFile(null); 
      formRef.current?.reset();
      
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error('Failed to create transaction:', err);
      setFormError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
      setStatusMessage('Save Transaction');
      setConflict(null);
    }
  };

  const handleAbandon = async () => {
     // NOTE: Logic for abandoning goals would need a DELETE endpoint in backend later.
     // For now, we simply acknowledge to proceed.
     handleCreateTransaction();
  };

  const handleAcknowledge = () => {
    handleCreateTransaction();
  };

  return (
    <>
      {conflict && (
        <CoinTossModal 
            goal={conflict}
            onAbandon={handleAbandon}
            onAcknowledge={handleAcknowledge}
        />
      )}

      <div className="w-full">
        <form ref={formRef} onSubmit={handleCreateTransaction} className="space-y-6">
          <div className="flex justify-center gap-8 text-gray-700">
            {/* Radio buttons */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" value="expense" checked={formData.type === "expense"} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
              Expense
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" value="income" checked={formData.type === "income"} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
              Income
            </label>
          </div>
          <div>
            {/* Description */}
            <input type="text" name="description" placeholder="Description (e.g., Groceries, Paycheck)" value={formData.description} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div>
            {/* Amount */}
            <input type="number" name="amount" placeholder="Amount" step="0.01" value={formData.amount} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>

          {/* Attachment */}
          <div>
            <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">
              Add Receipt (Optional)
            </label>
            <input
              id="attachment"
              type="file"
              onChange={handleFileChange}
              disabled={loading}
              accept="image/*,.pdf"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
            />
          </div>

          {formError && <p className="error">{formError}</p>}
          <button type="submit" className="primary-btn w-full" disabled={loading}>
            {loading ? statusMessage : 'Save Transaction'}
          </button>
        </form>
      </div>
    </>
  );
}