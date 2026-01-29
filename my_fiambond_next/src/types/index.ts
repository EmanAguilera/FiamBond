import { Timestamp } from 'firebase/firestore';

// This is the single source of truth for what a User object looks like.
export interface User {
    id: string;
    full_name: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    family_id: string | null;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    created_at: Timestamp;
    // --- ADD THIS LINE ---
    // This makes the property optional on the Transaction object.
    attachment_url?: string | null;
    user?: User; 
}

// This is the single, master definition for a Loan object.
export interface Loan {
    id: string;
    amount: number;
    interest_amount: number; 
    total_owed: number;
    repaid_amount: number;
    creditor_id: string;
    debtor_id: string | null; // Null for personal loans
    family_id: string | null;
    description: string;
    status: 'pending_confirmation' | 'outstanding' | 'repaid';
    created_at: Timestamp;
    deadline?: Timestamp | null;
    attachment_url?: string | null; // For the initial loan proof

    pending_repayment?: {
        amount: number;
        submitted_by: string;
        submitted_at: Timestamp;
        receipt_url?: string | null; // For family repayment proof
    };
    
    // This is the property causing the error. The '?' makes it optional.
    repayment_receipts?: {
        url: string;
        amount: number;
        recorded_at: Timestamp;
    }[]; // This is an array of objects for personal repayment proof

    // These are added in the app after fetching, not stored in Firestore
    creditor: User;
    debtor: User | null;
    debtor_name?: string; // For personal loans
}

export interface Goal {
    id: string;
    user_id: string;
    family_id: string | null;
    name: string;
    target_amount: number;
    target_date: Timestamp;
    status: 'active' | 'completed';
    created_at: Timestamp;
    completed_at: Timestamp | null;
    completed_by_user_id: string | null;
    achievement_url?: string | null;

    // These are added in the app, not in Firestore
    user: User;
    completed_by?: User | null;
    family?: { family_name: string };
}