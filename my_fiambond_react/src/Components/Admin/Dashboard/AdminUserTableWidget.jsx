import { memo } from 'react';

const SUBSCRIPTION_PRICE = 499.00;

// Internal Item Component
const UserItem = ({ user, type, onTogglePremium }) => {
    const initials = (user.full_name || user.first_name || "?").substring(0, 2).toUpperCase();
    const isPremium = user.is_premium;
    const isAdmin = user.role === 'admin';
    const isRevenueView = type === 'revenue';
    
    // --- DATE LOGIC FIX ---
    // If viewing Revenue, try to show when they PAID (granted_at). 
    // If that doesn't exist (old data), fall back to creation date.
    let displayDate = 'Unknown';
    if (user.premium_granted_at?.seconds) {
        displayDate = new Date(user.premium_granted_at.seconds * 1000).toLocaleDateString();
    } else if (user.created_at?.seconds) {
        displayDate = new Date(user.created_at.seconds * 1000).toLocaleDateString();
    }

    return (
        <div className="flex items-center p-4 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition-colors duration-150">
            {/* Avatar */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm 
                ${isAdmin ? 'bg-purple-100 text-purple-700' : 
                  isPremium ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-200' : 'bg-slate-200 text-slate-600'}`}>
                {initials}
            </div>

            {/* Info */}
            <div className="ml-4 flex-grow min-w-0">
                <p className="font-semibold text-gray-800 truncate">{user.full_name || user.first_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {isAdmin && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Admin</span>}
                    {!isAdmin && isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Company</span>}
                </div>
            </div>

            {/* Action / Value */}
            <div className="ml-4 flex items-center text-right">
                {isRevenueView ? (
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-emerald-600">+ ₱{SUBSCRIPTION_PRICE.toLocaleString()}</span>
                        <span className="text-xs text-slate-400">
                            {/* Display correct label */}
                            {user.premium_granted_at ? 'Paid: ' : 'Join: '} 
                            {displayDate}
                        </span>
                    </div>
                ) : (
                    <button 
                        onClick={() => onTogglePremium && onTogglePremium(user.id, user.is_premium)}
                        className={`text-xs font-bold px-3 py-1.5 rounded border transition shadow-sm ${
                            isPremium 
                            ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' 
                            : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                        // Disable button if looking at Admin list (safety)
                        disabled={type === 'admin'}
                    >
                        {type === 'admin' ? 'Super User' : (isPremium ? 'Revoke Company' : 'Grant Company')}
                    </button>
                )}
            </div>
        </div>
    );
};

function AdminUserTableWidget({ users, type, onTogglePremium, headerText }) {
    return (
        <div className="max-h-[60vh] overflow-y-auto">
            {headerText && (
                <div className={`px-4 py-3 border-b text-sm font-medium flex justify-between sticky top-0 z-10
                    ${type === 'revenue' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 
                      type === 'admin' ? 'bg-purple-50 border-purple-100 text-purple-800' : 
                      'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
                    {headerText}
                </div>
            )}
            
            {users && users.length > 0 ? (
                <div>
                    {users.map(u => (
                        <UserItem 
                            key={u.id} 
                            user={u} 
                            type={type} 
                            onTogglePremium={onTogglePremium} 
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center py-10 text-gray-500 italic">No records found.</p>
            )}
        </div>
    );
};

export default memo(AdminUserTableWidget);