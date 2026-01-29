'use client'; // Required due to the use of memo

import { memo } from 'react';

// Added onTogglePremium to props destructuring
export const AdminUserRow = memo(({ user, badge, rightContent, onTogglePremium }) => { 
    const initials = (user.full_name || user.first_name || "?").substring(0, 2).toUpperCase();
    const isAdmin = user.role === 'admin';
    
    // Note: The original implementation in AdminDashboard uses is_premium/is_family_premium,
    // but the simplified logic here is fine for demonstration as the full AdminDashboard
    // passes the correct user object.
    const isPremium = user.is_premium;
    
    // CHECK PENDING STATUS
    // The simplified logic here checks only for the main 'company' subscription status.
    // The full AdminDashboard logic in my previous response handles both company and family pending states.
    // For this isolated component, we'll stick to the provided pending check:
    const isPending = user.subscription_status === 'pending_approval'; 

    const renderAction = () => {
        if (rightContent) return rightContent; // For Revenue View or custom content from parent
        if (isAdmin) return <span className="text-xs font-bold text-gray-400">Super User</span>;

        // --- NEW: APPROVE BUTTON ---
        if (isPending) {
            return (
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-mono bg-gray-100 px-1 border rounded text-gray-500">
                        Ref: {user.payment_ref || 'N/A'}
                    </span>
                    <button 
                        // The original onTogglePremium usage here is complex: onTogglePremium(user.id, isRevoke=false, isApproval=true)
                        // It appears the full AdminDashboard uses: onTogglePremium(userId, action, type)
                        // This specific component's click handler needs to be updated to match the correct parent signature if we assume the parent handles multiple types.
                        // Since we don't have the parent's full logic in this isolated file, we will adapt the click handler to a more universal 'approve' action, assuming 'company' type for this button as per original intent:
                        onClick={() => onTogglePremium && onTogglePremium(user.id, 'approve', 'company')} // Assuming 'approve' action for company
                        className="text-xs font-bold px-3 py-1.5 rounded border bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-md animate-pulse"
                    >
                        Approve Payment
                    </button>
                </div>
            );
        }

        // Standard Grant/Revoke Button
        return (
            <button 
                // Adapting the click handler to the universal signature: onTogglePremium(userId, action, type)
                // action = 'revoke' if active, 'grant' if inactive. Type = 'company' for this button.
                onClick={() => onTogglePremium && onTogglePremium(user.id, isPremium ? 'revoke' : 'grant', 'company')}
                className={`text-xs font-bold px-3 py-1.5 rounded border transition shadow-sm ${
                    isPremium 
                    ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' 
                    : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                }`}
            >
                {isPremium ? 'Revoke Company' : 'Grant Company'}
            </button>
        );
    };

    return (
        <div className={`flex items-center p-4 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition-colors duration-150 
            ${isPending ? 'bg-amber-50/40' : ''}`}> {/* Highlight row slightly if pending */}
            
            {/* Avatar */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm 
                ${isAdmin ? 'bg-purple-100 text-purple-700' : 
                  isPremium ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-200' : 
                  isPending ? 'bg-yellow-100 text-yellow-600 ring-2 ring-yellow-300' : 
                  'bg-slate-200 text-slate-600'}`}>
                {initials}
            </div>

            {/* User Info */}
            <div className="ml-4 flex-grow min-w-0">
                <p className="font-semibold text-gray-800 truncate">{user.full_name || user.first_name || 'N/A'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500">{user.email}</p>
                    
                    {isAdmin && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Admin</span>}
                    {isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Company</span>}
                    {/* Pending Badge */}
                    {isPending && <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-yellow-200">Pending Review</span>}
                </div>
            </div>

            {/* Right Side Action */}
            <div className="ml-4 flex items-center text-right">
                {renderAction()}
            </div>
        </div>
    );
});