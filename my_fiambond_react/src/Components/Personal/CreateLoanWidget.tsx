import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../../Context/AppContext.jsx";
import { db } from "../../config/firebase-config.js";
import { writeBatch, collection, doc, serverTimestamp, Timestamp } from "firebase/firestore";

// --- TypeScript Interfaces ---
interface Family {
  id: string;
}

interface Member {
  id: string;
  full_name: string;
}

interface CreateLoanWidgetProps {
  family: Family;
  members: Member[]; // Expects the list of members as a prop
  onSuccess?: () => void;
}

// --- YOUR CLOUDINARY DETAILS ---
// Replace "YOUR_CLOUD_NAME" with your actual Cloudinary cloud name.
const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = "ml_default"; // The upload preset you made "unsigned"
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function CreateLoanWidget({ family, members, onSuccess }: CreateLoanWidgetProps) {
  const { user } = useContext(AppContext);

  // State for all the form text inputs
  const [formData, setFormData] = useState({
    amount: "",
    interest_amount: "",
    description: "",
    debtorId: "",
    deadline: "",
  });

  // State to hold the actual file selected by the user
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // State for handling errors and loading UI
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Confirm & Lend Money');

  // A generic handler for text inputs and the select dropdown
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // A specific handler for the file input
  const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Check if the user selected a file
    if (e.target.files && e.target.files[0]) {
      setAttachmentFile(e.target.files[0]);
    } else {
      setAttachmentFile(null);
    }
  };

  // The main submission function that handles the entire process
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

      // --- STEP 1: UPLOAD THE FILE DIRECTLY TO CLOUDINARY (if one exists) ---
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
          throw new Error('Failed to upload file to Cloudinary.');
        }

        const data = await response.json();
        attachmentUrl = data.secure_url; // Get the public URL from Cloudinary's response

        if (!attachmentUrl) {
          throw new Error("Cloudinary did not return a URL for the uploaded file.");
        }
      }

      setStatusMessage("Saving loan data...");

      // --- STEP 2: SAVE THE LOAN AND TRANSACTION DATA TO FIRESTORE ---
      const debtorName = members.find(m => m.id === formData.debtorId)?.full_name || 'Family Member';
      const batch = writeBatch(db); // Use a batch for atomic writes
      const principal = Number(formData.amount) || 0;
      const interest = Number(formData.interest_amount) || 0;

      const newLoanRef = doc(collection(db, "loans"));
      const loanData = {
        family_id: family.id,
        creditor_id: user.uid,
        debtor_id: formData.debtorId,
        amount: principal,
        interest_amount: interest,
        total_owed: principal + interest,
        repaid_amount: 0,
        description: formData.description,
        deadline: formData.deadline ? Timestamp.fromDate(new Date(formData.deadline)) : null,
        status: "pending_confirmation",
        created_at: serverTimestamp(),
        // Conditionally add the attachment_url field only if the upload was successful
        ...(attachmentUrl && { attachment_url: attachmentUrl }),
      };
      batch.set(newLoanRef, loanData);

      // Also create the corresponding personal expense transaction for the lender
      const newTransactionRef = doc(collection(db, "transactions"));
      const transactionData = {
        user_id: user.uid,
        family_id: null, // This is a personal transaction
        type: "expense",
        amount: principal,
        description: `Loan to ${debtorName}: ${formData.description}`,
        created_at: serverTimestamp(),
      };
      batch.set(newTransactionRef, transactionData);

      // Commit both writes to the database at the same time
      await batch.commit();

      // Call the success callback if it was provided (e.g., to close a modal)
      if (onSuccess) {
        onSuccess();
      }

    } catch (err: any) {
      console.error("Failed to process loan:", err);
      setError("Failed to process the loan. Please check your network connection and try again.");
    } finally {
      // This block runs whether the process succeeded or failed
      setLoading(false);
      setStatusMessage('Confirm & Lend Money');
    }
  };

  // Filter out the current user from the dropdown list to prevent lending to oneself
  const otherMembers = members.filter(member => member.id !== user?.uid);

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
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Loan Amount (Principal, ₱)</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          placeholder="100.00"
          value={formData.amount}
          onChange={handleInputChange}
          required
          disabled={loading}
          className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="interest_amount" className="block text-sm font-medium text-gray-700">Interest Amount (Optional, ₱)</label>
        <input
          id="interest_amount"
          type="number"
          step="0.01"
          placeholder="10.00"
          value={formData.interest_amount}
          onChange={handleInputChange}
          disabled={loading}
          className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Reason / Description</label>
        <input
          id="description"
          type="text"
          placeholder="e.g., Lunch money"
          value={formData.description}
          onChange={handleInputChange}
          required
          disabled={loading}
          className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">Repayment Deadline (Optional)</label>
        <input
          id="deadline"
          type="date"
          value={formData.deadline}
          onChange={handleInputChange}
          disabled={loading}
          className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="attachment" className="block text-sm font-medium text-gray-700">Attachment (Receipt, Optional)</label>
        <input
          id="attachment"
          type="file"
          accept="image/*,.pdf" // Suggests to the browser to only show image or PDF files
          onChange={handleAttachmentChange}
          disabled={loading}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      <button type="submit" className="primary-btn w-full" disabled={loading || otherMembers.length === 0}>
        {loading ? statusMessage : 'Confirm & Lend Money'}
      </button>
    </form>
  );
}