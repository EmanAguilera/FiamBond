'use client'; // Required due to the use of memo and useMemo

import { memo, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast'; // Client-side toast for notifications

// --- ICONS ---
const CheckIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>);
const XIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>);
const ClockIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>);

// --- INTERNAL COMPONENT: AdminUserRow ---
const AdminUserRow = memo(({ user, onTogglePremium }) => {
    // Determine the type of pending request
    const isCompanyPending = user.subscription_status === 'pending_approval';
    const isFamilyPending = user.family_subscription_status === 'pending_approval';
    const isPending = isCompanyPending || isFamilyPending;
    
    // Determine the most relevant access status for display
    const hasCompanyAccess = user.is_premium;
    const hasFamilyAccess = user.is_family_premium;
    
    const initials = (user.full_name || user.first_name || "U").substring(0, 2).toUpperCase();
    const canToggle = user.role !== 'admin';

    // --- Action Handlers for Pending Requests ---
    const handleAction = (action, accessType) => {
        if (!onTogglePremium) return;
        
        let confirmMessage;
        if (action === 'approve') {
            confirmMessage = `Approve ${accessType} access for ${user.full_name}?`;
        } else if (action === 'deny') {
            confirmMessage = `Deny ${accessType} request for ${user.full_name}?`;
        } else if (action === 'revoke') {
             confirmMessage = `Revoke ${accessType} access for ${user.full_name}?`;
        } else {
             confirmMessage = `Grant ${accessType} access for ${user.full_name}?`;
        }

        if (window.confirm(confirmMessage)) {
            // NOTE: The parent 'onTogglePremium' handles the full logic (approve/deny/grant/revoke)
            onTogglePremium(user.id, action, accessType); 
            toast.success(`${accessType} request ${action}d!`);
        }
    };
    
    // --- Render Content based on Status ---
    let mainActionContent = null;
    let badgeContent = null;
    let rowClasses = 'border-b last:border-b-0 hover:bg-gray-50';

    // PENDING LOGIC
    if (isPending) {
        rowClasses = 'border-b last:border-b-0 bg-amber-50 hover:bg-amber-100';
        badgeContent = <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><ClockIcon/> Pending</span>;
        
        mainActionContent = (
            <div className="flex gap-2 text-right flex-shrink-0">
                {isCompanyPending && (
                    <div className="bg-white p-2 rounded-lg border border-amber-200">
                        <p className="text-[10px] font-bold text-amber-700 mb-1">Company</p>
                        <button onClick={() => handleAction('approve', 'company')} className="text-xs font-bold px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 mr-1"><CheckIcon/></button>
                        <button onClick={() => handleAction('deny', 'company')} className="text-xs font-bold px-2 py-1 rounded bg-rose-500 text-white hover:bg-rose-600"><XIcon/></button>
                    </div>
                )}
                {isFamilyPending && (
                    <div className="bg-white p-2 rounded-lg border border-amber-200">
                        <p className="text-[10px] font-bold text-amber-700 mb-1">Family</p>
                        <button onClick={() => handleAction('approve', 'family')} className="text-xs font-bold px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 mr-1"><CheckIcon/></button>
                        <button onClick={() => handleAction('deny', 'family')} className="text-xs font-bold px-2 py-1 rounded bg-rose-500 text-white hover:bg-rose-600"><XIcon/></button>
                    </div>
                )}
            </div>
        );
        
    } else {
        // ACTIVE/INACTIVE ENTITY TOGGLE LOGIC
        badgeContent = hasCompanyAccess 
            ? <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Company</span> 
            : (hasFamilyAccess ? <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Family</span> : null);

        mainActionContent = (
            <div className="flex flex-col gap-1 text-right">
                {/* Toggle Company Access */}
                <button 
                    onClick={() => handleAction(hasCompanyAccess ? 'revoke' : 'grant', 'company')}
                    disabled={!canToggle} 
                    className={`text-xs font-bold px-3 py-1.5 rounded border transition shadow-sm ${
                        hasCompanyAccess
                        ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50' 
                        : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                    }`}
                    title={hasCompanyAccess ? 'Revoke Company Access' : 'Grant Company Access (Monthly)'}
                >
                    {hasCompanyAccess ? 'Revoke Company' : 'Grant Company'}
                </button>
                {/* Toggle Family Access */}
                <button 
                    onClick={() => handleAction(hasFamilyAccess ? 'revoke' : 'grant', 'family')}
                    disabled={!canToggle} 
                    className={`text-xs font-bold px-3 py-1.5 rounded border transition shadow-sm ${
                        hasFamilyAccess
                        ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50' 
                        : 'bg-teal-600 border-teal-600 text-white hover:bg-teal-700 disabled:opacity-50'
                    }`}
                    title={hasFamilyAccess ? 'Revoke Family Access' : 'Grant Family Access (Monthly)'}
                >
                    {hasFamilyAccess ? 'Revoke Family' : 'Grant Family'}
                </button>
            </div>
        );
    }


    return (
        <div className={`flex items-center p-4 border-gray-100 transition-colors duration-150 ${rowClasses}`}>
            {/* Avatar */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 font-bold text-sm">
                {initials}
            </div>

            {/* Main Info */}
            <div className="ml-4 flex-grow min-w-0">
                <p className="font-semibold text-gray-800 truncate">{user.full_name || 'N/A'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {badgeContent}
                </div>
            </div>

            {/* Right Side Action/Info */}
            <div className="ml-4 flex-shrink-0">
                {mainActionContent}
            </div>
        </div>
    );
});


// --- MAIN WIDGET: EntityManagementWidget ---
const EntityManagementWidget = ({ users, onTogglePremium, headerText }) => {

    // 1. Memoize and Filter/Sort Users
    const sortedUsers = useMemo(() => {
        if (!users) return []; 
        
        // Exclude Admin users from the entity management list
        const entityUsers = users.filter(u => u.role !== 'admin');

        // Separate pending users for top placement
        const pending = entityUsers.filter(u => u.subscription_status === 'pending_approval' || u.family_subscription_status === 'pending_approval');
        const activeOrInactive = entityUsers.filter(u => !pending.includes(u));
        
        // Sort active/inactive by creation date (descending)
        activeOrInactive.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));

        // Combine: Pending first, then the rest
        return [...pending, ...activeOrInactive];
    }, [users]);

    // Determine total pending count for the header
    const pendingCount = sortedUsers.filter(u => u.subscription_status === 'pending_approval' || u.family_subscription_status === 'pending_approval').length;
    
    // Fallback/Loading checks
    if (!users || users.length === 0) {
        return <div className="p-8 text-center text-slate-400 italic">No users found for entity management.</div>;
    }

    return (
        <div className="max-h-[60vh] overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
            {/* HEADER */}
            <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 text-indigo-800 text-sm font-medium sticky top-0 z-10">
                {pendingCount > 0 ? `⚠️ ${pendingCount} Subscription Request(s) to Review` : (headerText || 'Manage Access Rights')}
            </div>
            
            {/* USER LIST */}
            {sortedUsers.map(u => (
                <AdminUserRow 
                    key={u.id} 
                    user={u}
                    onTogglePremium={onTogglePremium}
                />
            ))}
        </div>
    );
};

export default memo(EntityManagementWidget);