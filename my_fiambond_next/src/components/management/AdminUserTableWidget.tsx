'use client';

import { memo, useEffect, useState, useMemo } from 'react';
import UnifiedLoadingWidget from "@/src/components/ui/UnifiedLoadingWidget";

const parseDate = (d: any) => d?.seconds ? new Date(d.seconds * 1000) : (d ? new Date(d) : null);

const getExpiry = (startRaw, plan) => {
    const start = parseDate(startRaw);
    if (!start || isNaN(start.getTime())) return null;
    const end = new Date(start);
    plan === 'yearly' ? end.setFullYear(end.getFullYear() + 1) : end.setMonth(end.getMonth() + 1);
    return end;
};

// --- SUBSCRIPTION TICKER ---
const SubscriptionTicker = ({ label, type, user, onRevoke }) => {
    const isPremium = type === 'company' ? user.is_premium : user.is_family_premium;
    const grantedAt = type === 'company' ? user.premium_granted_at : user.family_premium_granted_at;
    const plan = type === 'company' ? user.premium_plan : user.family_premium_plan;
    
    const endDate = getExpiry(grantedAt, plan || 'monthly');
    const startDate = parseDate(grantedAt);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!isPremium || !endDate) return;
        const interval = setInterval(() => {
            const diff = endDate.getTime() - new Date().getTime();
            if (diff <= 0) {
                setTimeLeft("EXPIRED");
                onRevoke(user.id, 'revoke', type);
                clearInterval(interval);
            } else {
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                const days = Math.floor(diff / 86400000);
                setTimeLeft(days > 0 ? `${days}d left` : `${mins}m ${secs}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [endDate, isPremium, user.id, type, onRevoke]);

    if (!isPremium || !startDate) return null;

    return (
        <div className={`mt-2 text-[10px] p-2 rounded-lg border flex flex-col gap-1 w-full sm:w-auto animate-in fade-in
            ${type === 'company' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-blue-700 bg-blue-50 border-blue-100'}`}>
            <div className="flex justify-between items-center font-bold border-b border-black/5 pb-1 gap-4">
                <span className="uppercase tracking-wider">{label} Realm ({plan || 'monthly'})</span>
                <span className={`font-mono ${timeLeft === 'EXPIRED' ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>{timeLeft}</span>
            </div>
            <div className="flex justify-between gap-6 text-xs mt-1">
                <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Start</span><span className="font-mono">{startDate.toLocaleDateString()}</span></div>
                <div className="text-right"><span className="text-slate-400 block text-[9px] uppercase font-bold">Expiry</span><span className="font-mono">{endDate?.toLocaleDateString()}</span></div>
            </div>
        </div>
    );
};

// --- USER ROW COMPONENT ---
const AdminUserRow = memo(({ user, onTogglePremium, onDeleteUser }) => {
    const initials = (user.full_name || user.first_name || "?").substring(0, 2).toUpperCase();
    const isAdmin = user.role === 'admin';
    const isCoPre = user.is_premium;
    const isFaPre = user.is_family_premium;
    const isPending = user.subscription_status === 'pending_approval' || user.family_subscription_status === 'pending_approval';

    const borderClass = isAdmin ? "border-purple-500 bg-purple-50/20" : 
                        isPending ? "border-amber-500 bg-amber-50/40" : 
                        (isCoPre || isFaPre) ? "border-emerald-500" : "border-transparent";

    const isPendingCompany = user.subscription_status === 'pending_approval';
    const pendingType = isPendingCompany ? 'Company' : 'Family';
    const pendingRef = isPendingCompany ? user.payment_ref : user.family_payment_ref;
    const pendingPlan = (isPendingCompany ? user.premium_plan : user.family_premium_plan) || 'monthly';
    const pendingDate = isPendingCompany ? user.request_date : user.family_request_date;
    const pendingReceipt = isPendingCompany ? user.receipt_url : user.family_receipt_url;

    return (
        <div className={`flex flex-col sm:flex-row sm:items-center p-4 border-b border-gray-100 last:border-0 border-l-[4px] transition-all ${borderClass} hover:bg-gray-50/50`}>
            <div className="flex items-start flex-grow">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm
                    ${isAdmin ? 'bg-purple-100 text-purple-700' : isPending ? 'bg-amber-100 text-amber-600' : (isCoPre || isFaPre) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                    {initials}
                </div>
                <div className="ml-4 flex flex-col w-full max-w-md text-left">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm">{user.full_name || "Unknown"}</h4>
                        {isAdmin && <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Admin</span>}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                    
                    <SubscriptionTicker label="Company" type="company" user={user} onRevoke={onTogglePremium} />
                    <SubscriptionTicker label="Family" type="family" user={user} onRevoke={onTogglePremium} />
                    
                    {/* ⭐️ TRANSACTION VERIFICATION INFO CARD */}
                    {isPending && (
                        <div className="mt-2 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1.5 text-left shadow-sm">
                            <div className="flex justify-between items-center font-extrabold text-amber-800 text-[10px] uppercase tracking-wider">
                                <span>⚠️ Pending {pendingType} Access</span>
                                <span className="font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-800">{pendingPlan}</span>
                            </div>
                            
                            <div className="flex justify-between items-center font-mono text-[11px] pt-1 border-t border-amber-200/60">
                                <span className="text-slate-500 font-sans font-bold">GCash Ref #:</span>
                                <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    {pendingRef || 'N/A'}
                                </span>
                            </div>

                            {pendingDate && (
                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                    <span>Submitted:</span>
                                    <span>{pendingDate?.toDate ? pendingDate.toDate().toLocaleString() : 'Recently'}</span>
                                </div>
                            )}

                            {pendingReceipt && (
                                <div className="pt-1 text-right">
                                    <a 
                                        href={pendingReceipt} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-[10px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
                                    >
                                        🔍 View GCash Screenshot
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* BUTTON CONTROLS */}
            <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-wrap sm:flex-col gap-2 items-end">
                {isPending ? (
                    <button 
                        onClick={() => onTogglePremium(user.id, 'approve', isPendingCompany ? 'company' : 'family')} 
                        className="bg-emerald-600 text-white text-xs font-extrabold uppercase px-4 py-2 rounded-xl shadow-md hover:bg-emerald-700 transition-all active:scale-95"
                    >
                        Approve Payment
                    </button>
                ) : !isAdmin && (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onTogglePremium(user.id, isCoPre ? 'revoke' : 'grant', 'company')} 
                            className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all active:scale-95 ${
                                isCoPre 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            }`}
                        >
                            {isCoPre ? 'Revoke Company' : '+ Grant Company'}
                        </button>

                        <button 
                            onClick={() => onTogglePremium(user.id, isFaPre ? 'revoke' : 'grant', 'family')} 
                            className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all active:scale-95 ${
                                isFaPre 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                            }`}
                        >
                            {isFaPre ? 'Revoke Family' : '+ Grant Family'}
                        </button>

                        <button 
                            onClick={() => onDeleteUser(user.id)} 
                            title="Remove User Record"
                            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

// --- MAIN WIDGET ---
const AdminUserTableWidget = ({ users = [], onTogglePremium, onDeleteUser, headerText, loading = false }) => {
    const sorted = useMemo(() => {
        return [...users].sort((a, b) => {
            const aP = a.subscription_status === 'pending_approval' || a.family_subscription_status === 'pending_approval' ? 1 : 0;
            const bP = b.subscription_status === 'pending_approval' || b.family_subscription_status === 'pending_approval' ? 1 : 0;
            return bP - aP;
        });
    }, [users]);

    if (loading) {
        return <UnifiedLoadingWidget type="section" message="Fetching user data..." />;
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[60vh]">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sticky top-0 z-10 backdrop-blur-md">
                {headerText || "Entity Access Management"}
            </div>
            <div className="overflow-y-auto custom-scrollbar">
                {sorted.length > 0 ? sorted.map((u) => (
                    <AdminUserRow 
                        key={u.id} 
                        user={u} 
                        onTogglePremium={onTogglePremium} 
                        onDeleteUser={onDeleteUser}
                    />
                )) : (
                    <div className="p-12 text-center text-slate-400 text-xs italic">No users available for review.</div>
                )}
            </div>
        </div>
    );
};

export default memo(AdminUserTableWidget);