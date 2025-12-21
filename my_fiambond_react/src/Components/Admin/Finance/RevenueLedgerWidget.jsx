import { memo } from 'react';
import { AdminUserRow } from '../Users/AdminUserRow'; 

const RevenueLedgerWidget = ({ premiums, users, currentAdminId }) => {

    const getAllTransactions = () => {
        // Build the ledger from the premiums collection (History)
        return premiums
            .filter(p => p.user_id !== currentAdminId) // Exclude admin's own tests
            .map(p => {
                // Find the user object associated with this premium record
                const userData = users.find(u => u.id === p.user_id) || { 
                    full_name: "Unknown User", 
                    email: "deleted@user.com" 
                };

                const dateVal = p.granted_at;
                const dateStr = dateVal?.seconds 
                    ? new Date(dateVal.seconds * 1000).toLocaleDateString() 
                    : 'Unknown Date';

                return {
                    uniqueId: p.id,
                    user: userData,
                    type: (p.access_type || 'COMPANY').toUpperCase(),
                    plan: (p.plan_cycle || 'MONTHLY').toUpperCase(),
                    price: p.amount || 0,
                    date: dateStr,
                    // Use different colors for visual distinction
                    color: p.access_type === 'family' ? 'text-indigo-600' : 'text-emerald-600',
                    badgeTheme: p.access_type === 'family' ? 'blue' : 'emerald',
                    timestamp: dateVal?.seconds || 0
                };
            })
            // Sort by most recent transaction first
            .sort((a, b) => b.timestamp - a.timestamp);
    };

    const transactions = getAllTransactions();

    return (
        <div className="max-h-[60vh] overflow-y-auto pr-2">
            {transactions.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {transactions.map(item => (
                        <AdminUserRow 
                            key={item.uniqueId} 
                            user={item.user}
                            // We override the buttons to show the price instead
                            rightContent={
                                <div className="flex flex-col items-end min-w-[100px]">
                                    <span className={`font-bold text-lg tracking-tight ${item.color}`}>
                                        + ₱{item.price.toLocaleString()}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1 opacity-90">
                                        <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded uppercase tracking-wider
                                            ${item.badgeTheme === 'emerald' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                            {item.type} • {item.plan}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {item.date}
                                        </span>
                                    </div>
                                </div>
                            }
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-slate-400 italic text-sm">No revenue transactions recorded yet.</p>
                </div>
            )}
        </div>
    );
};

export default memo(RevenueLedgerWidget);