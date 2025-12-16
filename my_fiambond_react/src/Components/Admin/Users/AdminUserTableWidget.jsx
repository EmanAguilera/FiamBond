import { memo } from 'react';

// --- ICONS ---
const CheckIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>;
const XIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;
const CopyIcon = () => <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>;

// --- ROW COMPONENT ---
const AdminUserRow = memo(({ user, rightContent, onTogglePremium }) => {
    const initials = (user.full_name || user.first_name || "?").substring(0, 2).toUpperCase();
    const isAdmin = user.role === 'admin';
    const isPremium = user.is_premium;
    const isPending = user.subscription_status === 'pending_approval';

    // Determine Row Border Color & Background
    let borderClass = "border-transparent";
    let bgClass = "hover:bg-gray-50";
    
    if (rightContent) {
        // If showing revenue (Transaction Log), keep it clean white
        borderClass = "border-emerald-100";
        bgClass = "hover:bg-emerald-50/30";
    } else if (isAdmin) {
        borderClass = "border-purple-500";
        bgClass = "bg-purple-50/30 hover:bg-purple-50/60";
    } else if (isPending) {
        borderClass = "border-amber-500";
        bgClass = "bg-amber-50/40 hover:bg-amber-50/70";
    } else if (isPremium) {
        borderClass = "border-emerald-500";
    }

    const renderAction = () => {
        // --- 1. REVENUE/TRANSACTION VIEW (The Fix) ---
        if (rightContent) return rightContent;

        // --- 2. PENDING STATE ---
        if (isPending) {
            return (
                <div className="flex flex-col items-end gap-2">
                    <button 
                        onClick={() => onTogglePremium(user.id, false, true)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 hover:shadow-lg transition-all active:scale-95"
                    >
                        <CheckIcon /> Approve
                    </button>
                    <button 
                        onClick={() => { if(confirm("Reject?")) onTogglePremium(user.id, true, false); }}
                        className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium px-2"
                    >
                        <XIcon /> Reject
                    </button>
                </div>
            );
        }

        // --- 3. ADMIN STATE ---
        if (isAdmin) return <span className="text-[10px] font-bold text-slate-400 border border-slate-200 bg-slate-50 px-2 py-1 rounded tracking-wider">SYSTEM ADMIN</span>;

        // --- 4. STANDARD USER STATE ---
        return (
            <button 
                onClick={() => onTogglePremium(user.id, user.is_premium)}
                className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all ${
                    isPremium 
                    ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50' 
                    : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                }`}
            >
                {isPremium ? 'Revoke Access' : 'Grant Company'}
            </button>
        );
    };

    return (
        <div className={`group relative flex flex-col sm:flex-row sm:items-center p-4 border-b border-gray-100 last:border-0 border-l-[4px] transition-all duration-200 ${borderClass} ${bgClass}`}>
            
            {/* LEFT: AVATAR & TEXT */}
            <div className="flex items-start flex-grow">
                {/* Avatar */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm
                    ${isAdmin ? 'bg-purple-100 text-purple-700' : 
                      isPremium ? 'bg-emerald-100 text-emerald-600' : 
                      isPending ? 'bg-amber-100 text-amber-600 animate-pulse-slow' : 
                      'bg-slate-200 text-slate-500'}`}>
                    {initials}
                </div>

                {/* Text Info */}
                <div className="ml-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm">{user.full_name || user.first_name || "Unknown User"}</h4>
                        {/* Status Badges */}
                        {isPending && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Review Needed</span>}
                        {isAdmin && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Admin</span>}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{user.email}</p>

                    {/* Pending Verification Ticket */}
                    {isPending && (
                        <div className="mt-3 flex items-center gap-0 text-xs bg-white border border-amber-200 rounded-lg overflow-hidden shadow-sm max-w-fit">
                            <div className="px-3 py-1.5 bg-slate-50 border-r border-slate-100 text-slate-500 font-medium">
                                {user.premium_plan === 'yearly' ? 'YEARLY' : 'MONTHLY'}
                            </div>
                            <div className="px-3 py-1.5 bg-white border-r border-slate-100 font-bold text-slate-700 flex items-center gap-1">
                                {user.payment_method || 'MANUAL'}
                            </div>
                            <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-mono font-bold tracking-wide select-all flex items-center gap-2 group/ref">
                                {user.payment_ref || 'NO_REF'}
                                <CopyIcon />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: ACTION BUTTONS / REVENUE INFO */}
            <div className="mt-4 sm:mt-0 sm:ml-4 flex items-center justify-end">
                {renderAction()}
            </div>
        </div>
    );
});

// --- MAIN TABLE WIDGET ---
const AdminUserTableWidget = ({ users, type, onTogglePremium, headerText }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[60vh]">
            {/* Header */}
            {headerText && (
                <div className={`px-5 py-3 border-b text-xs font-bold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md flex justify-between items-center
                    ${type === 'revenue' ? 'bg-emerald-50/90 border-emerald-100 text-emerald-800' : 
                      type === 'admin' ? 'bg-purple-50/90 border-purple-100 text-purple-800' : 
                      'bg-slate-50/90 border-slate-200 text-slate-600'}`}>
                    {headerText}
                </div>
            )}
            
            {/* Scrollable List */}
            <div className="overflow-y-auto flex-grow">
                {users && users.length > 0 ? (
                    <div>
                        {users.map(u => {
                            // --- CALCULATE CUSTOM CONTENT HERE ---
                            let customRightContent = undefined;

                            if (type === 'revenue') {
                                // 1. Determine Amount & Label
                                const plan = u.premium_plan || 'monthly';
                                const amount = plan === 'yearly' ? 15000 : 1500;
                                
                                // 2. Determine Date
                                const dateStr = u.premium_granted_at?.seconds 
                                    ? new Date(u.premium_granted_at.seconds * 1000).toLocaleDateString() 
                                    : u.created_at?.seconds 
                                        ? new Date(u.created_at.seconds * 1000).toLocaleDateString()
                                        : 'Unknown';

                                // 3. Build the Transaction Approach Component
                                customRightContent = (
                                    <div className="flex flex-col items-end animate-in fade-in duration-300">
                                        <span className="font-bold text-emerald-600 text-sm tracking-tight">
                                            + ₱{amount.toLocaleString()}
                                        </span>
                                        <div className="flex items-center gap-1.5 mt-1 opacity-80">
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 rounded uppercase">
                                                {plan}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {dateStr}
                                            </span>
                                        </div>
                                    </div>
                                );
                            } else if (type === 'admin') {
                                customRightContent = <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">Active Admin</span>;
                            }

                            return (
                                <AdminUserRow 
                                    key={u.id} 
                                    user={u} 
                                    rightContent={customRightContent} 
                                    onTogglePremium={onTogglePremium} 
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        <p className="text-sm font-medium">No records found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(AdminUserTableWidget);