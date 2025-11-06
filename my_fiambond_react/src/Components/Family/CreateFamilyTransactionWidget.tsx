import { useContext, useState, ChangeEvent, FormEvent, useRef } from "react";
import { AppContext } from "../../Context/AppContext.jsx";
import { db } from "../../config/firebase-config.js";
import { collection, serverTimestamp, writeBatch, doc } from "firebase/firestore";

// --- YOUR CLOUDINARY DETAILS ---
const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy"; 
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// --- FIX: Define interfaces for props and form state ---
interface Family {
  id: string;
  family_name: string;
}

interface CreateFamilyTransactionWidgetProps {
  family: Family;
  onSuccess?: () => void; // Optional function that returns nothing
}

interface ITransactionForm {
  description: string;
  amount: string;
  type: "expense" | "income";
}

// --- FIX: Apply the props interface to the component ---
export default function CreateFamilyTransactionWidget({ family, onSuccess }: CreateFamilyTransactionWidgetProps) {
  const { user } = useContext(AppContext);
  // --- FIX: Provide the correct type for the form ref ---
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState<ITransactionForm>({
    description: "",
    amount: "",
    type: "expense",
  });
  
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Save Transaction');
  // --- FIX: Tell useState that the error can be a string OR null ---
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // --- FIX: Add type for the event object ---
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };
  
  // --- FIX: Add type for the event object ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setAttachmentFile(e.target.files[0]);
      } else {
          setAttachmentFile(null);
      }
  };

  // --- FIX: Add type for the event object ---
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

      const batch = writeBatch(db);

      const familyTransactionRef = doc(collection(db, "transactions"));
      const familyTransactionData = {
        user_id: user.uid,
        family_id: family.id,
        description: formData.description,
        amount: Number(formData.amount),
        type: formData.type,
        created_at: serverTimestamp(),
        attachment_url: uploadedUrl,
      };
      batch.set(familyTransactionRef, familyTransactionData);

      const personalTransactionRef = doc(collection(db, "transactions"));
      const personalDescription = formData.type === 'income' 
        ? `Family Income (${family.family_name}): ${formData.description}` 
        : `Family Expense (${family.family_name}): ${formData.description}`;
      const personalTransactionData = {
        user_id: user.uid,
        family_id: null,
        description: personalDescription,
        amount: Number(formData.amount),
        type: 'expense',
        created_at: serverTimestamp(),
        attachment_url: uploadedUrl,
      };
      batch.set(personalTransactionRef, personalTransactionData);
      
      await batch.commit();

      setFormData({ description: "", amount: "", type: "expense" });
      setAttachmentFile(null);
      // This will now work because formRef.current is typed correctly
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