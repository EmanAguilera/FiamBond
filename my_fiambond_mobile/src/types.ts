export interface User {
    uid: string;
    email: string | null;
    emailVerified: boolean;
    // Add other properties from userData if they are consistently present
    // For example:
    full_name?: string;
    last_name?: string;
    role?: string;
    is_premium?: boolean;
    is_family_premium?: boolean;
    subscription_status?: string;
    family_subscription_status?: string;
    active_company_premium_id?: string;
    active_family_premium_id?: string;
}

export interface PremiumDetails {
    company: any; // Define a more specific type if known
    family: any;  // Define a more specific type if known
}

export interface AppContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    loading: boolean;
    handleLogout: () => Promise<void>;
    premiumDetails: PremiumDetails;
}
