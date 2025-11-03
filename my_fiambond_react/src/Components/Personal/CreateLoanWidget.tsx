import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../../Context/AppContext.jsx";

// Make sure 'functions' is exported from your firebase-config file!
import { db, functions } from "../../config/firebase-config.js"; 

import { httpsCallable } from "firebase/functions";
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

// --- Define the Cloud Function we will call ---
// It's a best practice to define this once outside the component.
// The name 'uploadLoanAttachment' MUST match the function name in your Python code.
const uploadLoanAttachment = httpsCallable(functions, 'uploadLoanAttachment');

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

  // The main submission function
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

      // --- STEP 1: UPLOAD THE FILE (if one exists) ---
      if (attachmentFile) {
        setStatusMessage("Uploading attachment...");
        
        // We must convert the file to a Base64 string to send it in a JSON payload
        // to our Firebase Function. This is a standard technique.
        const reader = new FileReader();
        reader.readAsDataURL(attachmentFile);
        const fileAsBase64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

        // Call the 'uploadLoanAttachment' cloud function with the file data
        const result = await uploadLoanAttachment({ file: fileAsBase64 });

        // Get the public S3 URL back from the function's response
        attachmentUrl = (result.data as { url: string }).url;
        
        if (!attachmentUrl) {
            throw new Error("The upload function did not return a URL.");
        }
      }
      
      setStatusMessage("Saving loan data...");

      // --- STEP 2: SAVE DATA TO FIRESTORE ---
      const debtorName = members.find(m => m.id === formData.debtorId)?.full_name || 'Family Member';
      const batch = writeBatch(db);
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
          // Conditionally add the attachment_url field only if it exists
          ...(attachmentUrl && { attachment_url: attachmentUrl }),
      };
      batch.set(newLoanRef, loanData);

      // Also create the corresponding personal expense transaction
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

      // Call the success callback if it was provided
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

  // Filter out the current user from the dropdown list
  const otherMembers = members.filter(member => member.id !== user?.uid);

  return (
    <form onSubmit={handleLendMoney} className="space-y-4">
      <div>
        <label htmlFor="debtorId" className="block text-sm font-medium text-gray-700">Lending To:</label>
        <select id="debtorId" value={formData.debtorId} onChange={handleInputChange} required disabled={loading || otherMembers.length === 0} className="w-full p-2 border border-gray-300 rounded-md">
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

      {/* The new file input field */}
      <div>
        <label htmlFor="attachment" className="block text-sm font-medium text-gray-700">Attachment (Receipt, Optional)</label>
        <input 
          id="attachment" 
          type="file" 
          onChange={handleAttachmentChange} 
          disabled={loading} 
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
        />
      </div>

      {error && <p className="error text-center">{error}</p>}

      <button type="submit" className="primary-btn w-full" disabled={loading || otherMembers.length === 0}>
        {loading ? statusMessage : 'Confirm & Lend Money'}
      </button>
    </form>
  );
}