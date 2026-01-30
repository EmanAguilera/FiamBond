'use client'; // Required due to the use of memo, useState, useEffect, and window/alert/confirm

import { memo, useEffect, useState } from 'react';

// --- CONFIGURATION ---
// TRUE  = 1 Minute Expiry (For Testing)
// FALSE = 30 Days / 1 Year Expiry (For Production)
const TEST_MODE = false; 

// --- ICONS ---
const CheckIcon = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>;
const ClockIcon = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;

// --- HELPER: ROBUST DATE PARSER (MongoDB + Firebase) ---
const parseDate = (dateVal) => {
    if (!dateVal) return null;
    // Handle Firestore Timestamp ({ seconds: ... })
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
    // Handle MongoDB/String/Standard Date
    return new Date(dateVal);
};

// --- HELPER: CALCULATE EXPIRY ---
const getExpirationDetails = (rawDate, plan) => {
    const start = parseDate(rawDate);
    if (!start || isNaN(start.getTime())) return null;

    const end = new Date(start);

    if (TEST_MODE) {
        // TEST MODE: 1 Minute for Monthly
        if (plan === 'yearly') end.setMinutes(end.getMinutes() + 5);
        else end.setMinutes(end.getMinutes() + 1);
    } else {
        // REAL MODE
        if (plan === 'yearly') end.setFullYear(end.getFullYear() + 1);
        else end.setMonth(end.getMonth() + 1);
    }

    return end;
};

// --- COMPONENT: REAL-TIME SUBSCRIPTION TICKER ---
const SubscriptionTicker = ({ label, type, user, onRevoke }) => {
    const isPremium = type === 'company' ? user.is_premium : user.is_family_premium;
    const grantedAt = type === 'company' ? user.premium_granted_at : user.family_premium_granted_at;
    const plan = type === 'company' ? user.premium_plan : user.family_premium_plan;
    
    // Parse Dates
    const endDate = getExpirationDetails(grantedAt, plan || 'monthly');
    const startDate = parseDate(grantedAt); // Used for display only
    
    const [timeLeft, setTimeLeft] = useState('Calculating...');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!isPremium || !endDate) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diff = endDate - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft("EXPIRED");
                clearInterval(interval);
                
                // Auto-revoke trigger
                if (isPremium && !isExpired) {
                    // ⭐️ Client-side trigger for parent action
                    console.log(`Auto-revoking ${type} for ${user.email}`);
                    onRevoke(user.id, 'revoke', type); 
                }
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                if (TEST_MODE) {
                    setTimeLeft(`${minutes}m ${seconds}s`);
                } else {
                    if (days > 1) setTimeLeft(`${days} days left`);
                    else setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                }
            }
        }, 1000);

        // Cleanup function for the interval
        return () => clearInterval(interval);
        // Dependencies updated to reflect state/props usage
    }, [endDate, isPremium, user.id, type, onRevoke, isExpired, user.email]); 

    if (!isPremium || !startDate) return null;

    const theme = type === 'company' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-blue-700 bg-blue-50 border-blue-100';
    
    // FORMAT DATES
    const startStr = startDate.toLocaleDateString(); 
    // Format End Date to show Date AND Time
    const endStr = endDate.toLocaleString([], { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    return (
        <div className={`mt-2 text-[10px] p-2 rounded-lg border ${theme} flex flex-col gap-1 w-full sm:w-auto animate-in fade-in`}>
            {/* Header: Label + Countdown */}
            <div className="flex justify-between items-center font-bold border-b border-black/5 pb-1 mb-1">
                <span className="uppercase tracking-wider">{label}</span>
                <span className={`flex items-center gap-1 font-mono ${isExpired ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
                    <ClockIcon /> {timeLeft}
                </span>
            </div>

            {/* Body: Start & End Dates */}
            <div className="flex justify-between gap-6 text-xs">
                <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Start Date</span>
                    <span className="font-mono font-medium whitespace-nowrap">{startStr}</span>
                </div>
                <div className="text-right">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">End Date</span>
                    <span className="font-mono font-bold whitespace-nowrap">{endStr}</span>
                </div>
            </div>
        </div>
    );
};

// --- ROW COMPONENT ---
export const AdminUserRow = memo(({ user, rightContent, onTogglePremium }) => {
    const initials = (user.full_name || user.first_name || "?").substring(0, 2).toUpperCase();
    const isAdmin = user.role === 'admin';
    
    const isCompanyPremium = user.is_premium;
    const isCompanyPending = user.subscription_status === 'pending_approval';
    const isFamilyPremium = user.is_family_premium;
    const isFamilyPending = user.family_subscription_status === 'pending_approval';

    let borderClass = "border-transparent";
    let bgClass = "hover:bg-gray-50";
    
    // Determine visual styling based on status
    if (rightContent) {
        borderClass = "border-emerald-100";
        bgClass = "hover:bg-emerald-50/30";
    } else if (isAdmin) {
        borderClass = "border-purple-500";
        bgClass = "bg-purple-50/30 hover:bg-purple-50/60";
    } else if (isCompanyPending || isFamilyPending) {
        borderClass = "border-amber-500";
        bgClass = "bg-amber-50/40 hover:bg-amber-50/70";
    } else if (isCompanyPremium || isFamilyPremium) {
        borderClass = "border-emerald-500";
    }

    // Buttons for Approval
    const approvalButtons = (type, label) => (
        <div className="flex flex-col gap-2 items-end">
            <button onClick={() => onTogglePremium(user.id, 'approve', type)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-emerald-700 transition-all active:scale-95">
                <CheckIcon /> {label}
            </button>
            {/* Using window.confirm is fine in a client component */}
            <button onClick={() => { if(window.confirm("Reject?")) onTogglePremium(user.id, 'reject', type); }} className="text-xs text-rose-500 hover:text-rose-700 font-medium px-2">Reject</button>
        </div>
    );

    const renderAction = () => {
        if (rightContent) return rightContent;
        // Prioritize Pending Actions
        if (isCompanyPending) return approvalButtons('company', 'Approve Co.');
        if (isFamilyPending) return approvalButtons('family', 'Approve Fam.');
        
        // Admin Label
        if (isAdmin) return <span className="text-[10px] font-bold text-slate-400 border border-slate-200 bg-slate-50 px-2 py-1 rounded tracking-wider">SYSTEM ADMIN</span>;

        // Grant/Revoke Buttons
        return (
            <div className="flex flex-col gap-2 items-end">
                <button 
                    onClick={() => onTogglePremium(user.id, isCompanyPremium ? 'revoke' : 'grant', 'company')}
                    className={`text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-md border transition-all w-28 ${
                        isCompanyPremium ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50' : 'bg-white border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                >
                    {isCompanyPremium ? 'Revoke Co.' : '+ Grant Co.'}
                </button>
                <button 
                    onClick={() => onTogglePremium(user.id, isFamilyPremium ? 'revoke' : 'grant', 'family')}
                    className={`text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-md border transition-all w-28 ${
                        isFamilyPremium ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50' : 'bg-white border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                >
                    {isFamilyPremium ? 'Revoke Fam.' : '+ Grant Fam.'}
                </button>
            </div>
        );
    };

    return (
        <div className={`group relative flex flex-col sm:flex-row sm:items-center p-4 border-b border-gray-100 last:border-0 border-l-[4px] transition-all duration-200 ${borderClass} ${bgClass}`}>
            <div className="flex items-start flex-grow">
                {/* Avatar */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm
                    ${isAdmin ? 'bg-purple-100 text-purple-700' : 
                      (isCompanyPremium || isFamilyPremium) ? 'bg-emerald-100 text-emerald-600' : 
                      (isCompanyPending || isFamilyPending) ? 'bg-amber-100 text-amber-600 animate-pulse-slow' : 
                      'bg-slate-200 text-slate-500'}`}>
                    {initials}
                </div>
                <div className="ml-4 flex flex-col justify-center w-full max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-800 text-sm">{user.full_name || user.first_name || "Unknown User"}</h4>
                        {isAdmin && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Admin</span>}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-1">{user.email}</p>

                    {/* Tickers - Only show if active AND not rendering custom rightContent */}
                    {isCompanyPremium && !rightContent && <SubscriptionTicker label="Company Plan" type="company" user={user} onRevoke={onTogglePremium} />}
                    {isFamilyPremium && !rightContent && <SubscriptionTicker label="Family Plan" type="family" user={user} onRevoke={onTogglePremium} />}
                    
                    {/* Pending Status - Only show if pending AND not rendering custom rightContent */}
                    {isCompanyPending && !rightContent && <div className="mt-2 text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-200">Pending Company Approval</div>}
                    {isFamilyPending && !rightContent && <div className="mt-2 text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-200">Pending Family Approval</div>}
                </div>
            </div>
            {/* Action/Right Content */}
            <div className="mt-4 sm:mt-0 sm:ml-4 flex items-center justify-end">{renderAction()}</div>
        </div>
    );
});

// --- MAIN TABLE WIDGET (Kept as is) ---
const AdminUserTableWidget = ({ users, type, onTogglePremium, headerText }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[60vh]">
            {headerText && (
                <div className={`px-5 py-3 border-b text-xs font-bold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md flex justify-between items-center
                    ${type === 'revenue' ? 'bg-emerald-50/90 border-emerald-100 text-emerald-800' : 'bg-slate-50/90 border-slate-200 text-slate-600'}`}>
                    {headerText}
                </div>
            )}
            <div className="overflow-y-auto flex-grow">
                {users && users.length > 0 ? (
                    users.map(u => {
                        let customRight = undefined;
                        if (type === 'revenue') {
                            // Revenue logic is complex, but the data should be structured in the parent component 
                            // to pass the *actual* amount paid for accuracy.
                            // The current logic here assumes MONTHLY=1500, YEARLY=15000, which might be wrong.
                            // However, since the goal is conversion, we keep the original simplified logic:
                            const plan = u.premium_plan || 'monthly';
                            const amount = plan === 'yearly' ? 15000 : 1500;
                            const dateObj = parseDate(u.premium_granted_at);
                            const dateStr = dateObj ? dateObj.toLocaleDateString() : '-';
                            customRight = (
                                <div className="flex flex-col items-end">
                                    <span className="font-bold text-emerald-600 text-sm">+ ₱{amount.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">{dateStr}</span>
                                </div>
                            );
                        }
                        // AdminUserRow handles the rendering based on props
                        return <AdminUserRow key={u.id} user={u} rightContent={customRight} onTogglePremium={onTogglePremium} />;
                    })
                ) : (
                    <div className="p-8 text-center text-slate-400 text-sm">No records found</div>
                )}
            </div>
        </div>
    );
};

export default memo(AdminUserTableWidget);