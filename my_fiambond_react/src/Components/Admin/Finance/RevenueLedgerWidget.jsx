import { memo } from 'react';
import { AdminUserRow } from '../Users/AdminUserRow'; 

const RevenueLedgerWidget = ({ users }) => {

    // Helper to determine price based on plan stored in DB
    const getPlanDetails = (user) => {
        const plan = user.premium_plan || 'monthly'; // Default to monthly if missing (e.g. manual grant)
        
        if (plan === 'yearly') {
            return { price: 15000, label: 'YEARLY' };
        }
        return { price: 1500, label: 'MONTHLY' };
    };

    return (
        <div className="max-h-[60vh] overflow-y-auto">
            {/* 
               Note: The header text (Total Funds) is passed 
               from the parent (AdminDashboard) into the Modal, 
               so we just render the list here.
            */}
            
            {users && users.length > 0 ? (
                <div>
                    {users.map(u => {
                        // 1. Format the Date
                        let displayDate = 'Unknown';
                        if (u.premium_granted_at?.seconds) {
                            displayDate = new Date(u.premium_granted_at.seconds * 1000).toLocaleDateString();
                        } else if (u.created_at?.seconds) {
                            displayDate = new Date(u.created_at.seconds * 1000).toLocaleDateString();
                        }

                        // 2. Get Price Info
                        const { price, label } = getPlanDetails(u);

                        return (
                            <AdminUserRow 
                                key={u.id} 
                                user={u}
                                badge={
                                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                        Company
                                    </span>
                                }
                                rightContent={
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-emerald-600">
                                            + ₱{price.toLocaleString()}
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1 rounded uppercase">
                                                {label}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {displayDate}
                                            </span>
                                        </div>
                                    </div>
                                }
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-3 bg-gray-100 rounded-full mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <p className="text-gray-500 italic">No active subscriptions found.</p>
                </div>
            )}
        </div>
    );
};

export default memo(RevenueLedgerWidget);