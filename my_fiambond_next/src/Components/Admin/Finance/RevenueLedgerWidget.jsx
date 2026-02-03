'use client'; 

import { memo } from 'react';

// --- AdminUserRow (Kept exactly as you provided) ---
const AdminUserRow = memo(({ user, badge, rightContent }) => {
    const initials = (user.full_name || user.first_name || "U").substring(0, 2).toUpperCase();
    return (
        <div className="flex items-center p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 font-bold text-sm">
                {initials}
            </div>
            <div className="ml-4 flex-grow min-w-0">
                <p className="font-semibold text-gray-800 truncate">{user.full_name || 'N/A'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {badge}
                </div>
            </div>
            <div className="ml-4 flex-shrink-0">
                {rightContent}
            </div>
        </div>
    );
});

const RevenueLedgerWidget = ({ premiums, users, currentAdminId }) => {

    const getAllTransactions = () => {
        if (!premiums) return []; // Guard against undefined premiums prop

        return premiums
            .filter(p => p.user_id !== currentAdminId) 
            .map(p => {
                const userData = users.find(u => u.id === p.user_id) || { 
                    full_name: "Unknown User", 
                    email: p.email || "deleted@user.com" 
                };

                // ⭐️ IMPROVED DATE HANDLING
                const dateVal = p.granted_at;
                let dateObj;
                
                if (dateVal?.seconds) {
                    dateObj = new Date(dateVal.seconds * 1000);
                } else if (dateVal instanceof Date) {
                    dateObj = dateVal;
                } else {
                    dateObj = new Date(); // Fallback to current time if pending
                }
                
                const dateStr = dateObj.toLocaleDateString();

                return {
                    uniqueId: p.id,
                    user: userData,
                    type: (p.access_type || 'COMPANY').toUpperCase(),
                    plan: (p.plan_cycle || 'MONTHLY').toUpperCase(),
                    price: p.amount || 0,
                    date: dateStr,
                    color: p.access_type === 'family' ? 'text-indigo-600' : 'text-emerald-600',
                    badgeTheme: p.access_type === 'family' ? 'blue' : 'emerald',
                    timestamp: dateVal?.seconds || Date.now() / 1000 // Ensure valid sort key
                };
            })
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
                            badge={
                                <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded uppercase tracking-wider
                                    ${item.badgeTheme === 'emerald' 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                    {item.type}
                                </span>
                            }
                            rightContent={
                                <div className="flex flex-col items-end min-w-[100px]">
                                    <span className={`font-bold text-lg tracking-tight ${item.color}`}>
                                        + ₱{item.price.toLocaleString()}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1 opacity-90">
                                        <span className="text-[10px] font-bold text-slate-500">
                                            {item.plan}
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