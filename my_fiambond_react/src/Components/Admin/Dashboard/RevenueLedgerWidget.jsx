import { memo } from 'react';
import { AdminUserRow } from './AdminUserRow'; // <--- MUST have { } brackets

const SUBSCRIPTION_PRICE = 499.00;

const RevenueLedgerWidget = ({ users, totalRevenue }) => {
    // ... rest of your code ...
    return (
        <div className="max-h-[60vh] overflow-y-auto">
            {/* ... header ... */}
            {users.length > 0 ? (
                <div>
                    {users.map(u => {
                        const joinDate = u.created_at?.seconds 
                            ? new Date(u.created_at.seconds * 1000).toLocaleDateString() 
                            : 'Unknown';

                        return (
                            <AdminUserRow 
                                key={u.id} 
                                user={u}
                                badge={<span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Company</span>}
                                rightContent={
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-emerald-600">+ ₱{SUBSCRIPTION_PRICE.toLocaleString()}</span>
                                        <span className="text-xs text-slate-400">Join: {joinDate}</span>
                                    </div>
                                }
                            />
                        );
                    })}
                </div>
            ) : (
                <p className="text-center py-8 text-gray-500 italic">No active subscriptions.</p>
            )}
        </div>
    );
};

export default memo(RevenueLedgerWidget); // <--- MUST be default export