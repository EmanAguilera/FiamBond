import { Timestamp } from 'firebase/firestore';

// This is the single source of truth for what a User object looks like.
export interface User {
    id: string;
    full_name: string;
}

// This is the single, master definition for a Loan object.
export interface Loan {
    id: string;
    amount: number;
    interest_amount: number; 
    total_owed: number;
    repaid_amount: number;
    creditor_id: string;
    debtor_id: string;
    family_id: string | null;
    description: string;
    status: 'pending_confirmation' | 'outstanding' | 'repaid';
    created_at: Timestamp;
    deadline?: Timestamp | null;

    // --- THIS IS THE NEWLY ADDED FIELD ---
    // This field will only exist on a loan document when a debtor has
    // submitted a repayment that the creditor has not yet confirmed.
    pending_repayment?: {
        amount: number;
        submitted_by: string;
        submitted_at: Timestamp;
    };

    // These properties are added to the object in the application after fetching user data.
    // They are not stored in the 'loans' collection in Firestore.
    creditor: User;
    debtor: User | null;
    debtor_name?: string; // A fallback for personal loans without a user object.
}