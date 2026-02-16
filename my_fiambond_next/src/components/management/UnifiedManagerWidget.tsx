'use client';

import React, { useState, useCallback, useContext, useEffect, memo } from 'react';
import { AppContext } from '../../context/AppContext';
import { db } from '../../config/firebase-config';
import { API_BASE_URL } from '@/src/config/apiConfig';
import { collection, query, where, getDocs, documentId, doc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import UnifiedLoadingWidget from '../../components/ui/UnifiedLoadingWidget';

// --- TYPES ---
type RealmType = "family" | "company" | "admin";
type ManagerMode = "directory" | "members";

interface SchemeConfig {
    label: string;
    plural: string;
    memberLabel: string;
    memberPlural: string;
    apiPath: string;
    nameKey: string;
    accent: string;
    dataSource: "api" | "firebase";
}

interface RealmItem {
    id: string;
    uid?: string;
    email?: string;
    full_name?: string;
    role?: string;
    isOwner?: boolean;
    owner_id?: string;
    ownerDetails?: { full_name: string };
    [key: string]: any; 
}

const SCHEMES: Record<RealmType, SchemeConfig> = {
    family: {
        label: "Family",
        plural: "Families",
        memberLabel: "Member",
        memberPlural: "Household",
        apiPath: "families",
        nameKey: "family_name",
        accent: "indigo",
        dataSource: "api"
    },
    company: {
        label: "Company",
        plural: "Companies",
        memberLabel: "Employee",
        memberPlural: "Workforce",
        apiPath: "companies",
        nameKey: "company_name",
        accent: "indigo",
        dataSource: "api"
    },
    admin: {
        label: "System",
        plural: "System Users",
        memberLabel: "Administrator",
        memberPlural: "Admin Team",
        apiPath: "users",
        nameKey: "full_name",
        accent: "purple",
        dataSource: "firebase"
    }
};

const Icons = {
    Plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>,
    Enter: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>,
    Trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
    Loading: <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
    Shield: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
};

// --- ACTION FORM ---
interface ActionFormProps {
    type: RealmType;
    mode: ManagerMode;
    onConfirm: (val: string) => Promise<void>;
    onCancel: () => void;
}

const ActionForm = ({ type, mode, onConfirm, onCancel }: ActionFormProps) => {
    const [val, setVal] = useState("");
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle'); 
    const [errorMsg, setErrorMsg] = useState("");
    const config = SCHEMES[type];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg("");
        try {
            await onConfirm(val);
            setVal("");
            setStatus('idle');
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err.message || "An unexpected error occurred.");
        }
    };

    const accentClass = config.accent === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700';

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm mt-2">
            <p className="text-xs text-slate-500 mb-4 font-medium">
                {type === 'admin' ? "Enter email to promote to Administrator." : 
                 mode === 'members' ? `Enter email to onboard to ${config.label}.` : 
                 `Name your new ${config.label.toLowerCase()} realm.`}
            </p>
            <div className="relative">
                <input 
                    type={(type === 'admin' || mode === 'members') ? "email" : "text"} 
                    required autoFocus
                    disabled={status === 'loading'}
                    value={val} 
                    onChange={(e) => { setVal(e.target.value); if (status === 'error') setStatus('idle'); }} 
                    className={`w-full px-4 py-2 border rounded-lg text-sm mb-1 focus:outline-none focus:ring-2 transition-all text-slate-800 
                        ${status === 'error' ? 'border-rose-500 focus:ring-rose-200' : `border-slate-300 focus:ring-indigo-500`}`} 
                    placeholder={(type === 'admin' || mode === 'members') ? "user@example.com" : `e.g. My ${config.label}`} 
                />
                {status === 'error' && <p className="text-[10px] text-rose-600 font-bold mt-1 ml-1 animate-pulse">⚠️ {errorMsg}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-3">
                <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                <button 
                    type="submit" 
                    disabled={status === 'loading' || !val.trim()} 
                    className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm ${accentClass}`}
                >
                    {status === 'loading' ? Icons.Loading : (type === 'admin' ? 'Promote' : (mode === 'members' ? 'Invite' : 'Create'))}
                </button>
            </div>
        </form>
    );
};

// --- MAIN COMPONENT ---
interface UnifiedManagerProps {
    type?: RealmType;
    mode?: ManagerMode;
    realmData?: any;
    members?: RealmItem[];
    onEnterRealm?: (item: RealmItem) => void;
    onUpdate?: () => void;
}

const UnifiedManagerWidget = ({ type = "family", mode = "directory", realmData = null, members = [], onEnterRealm, onUpdate }: UnifiedManagerProps) => {
    const context = useContext(AppContext) as any || {};
    const user = context.user;
    
    const [items, setItems] = useState<RealmItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false); // 🟢 Overlay Trigger
    const [showForm, setShowForm] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const config = SCHEMES[type];

    const fetchData = useCallback(async () => {
        if (!user?.uid || !db) return;
        setLoading(true);
        try {
            if (config.dataSource === "firebase") {
                const q = query(collection(db as Firestore, "users"), where("role", "==", "admin"));
                const snap = await getDocs(q);
                setItems(snap.docs.map(d => ({ 
                    id: d.id, 
                    ...d.data(), 
                    [config.nameKey]: (d.data() as any).full_name || (d.data() as any).email,
                    isOwner: false 
                })));
            } else if (mode === "directory") {
                const res = await fetch(`${API_BASE_URL}/${config.apiPath}?user_id=${user.uid}`);
                const raw = await res.json();
                let mapped: RealmItem[] = raw.map((item: any) => ({
                    ...item,
                    id: (item._id || item.id).toString(),
                    isOwner: item.owner_id === user.uid
                }));

                const ownerIds = [...new Set(mapped.map(f => f.owner_id))].filter(Boolean) as string[];
                if (ownerIds.length > 0) {
                    const ownersMap: Record<string, any> = {};
                    const q = query(collection(db as Firestore, "users"), where(documentId(), "in", ownerIds.slice(0, 10)));
                    const snap = await getDocs(q);
                    snap.forEach(doc => { ownersMap[doc.id] = doc.data(); });
                    mapped = mapped.map(item => ({
                        ...item,
                        ownerDetails: ownersMap[item.owner_id!] || { full_name: 'Unknown User' }
                    }));
                }
                setItems(mapped);
            }
        } catch (err) { 
            toast.error(`Failed to sync ${config.plural}.`); 
        } finally { 
            setLoading(false); 
        }
    }, [user?.uid, mode, config]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleConfirm = async (value: string) => {
        if (!db || !user?.uid) return;
        setIsProcessing(true); // 🟢 Start Overlay
        try {
            if (type === 'admin') {
                const q = query(collection(db as Firestore, "users"), where("email", "==", value.trim().toLowerCase()));
                const snap = await getDocs(q);
                if (snap.empty) throw new Error("No user found with that email.");
                await updateDoc(doc(db as Firestore, "users", snap.docs[0].id), { 
                    role: 'admin', 
                    promoted_at: serverTimestamp() 
                });
                toast.success("User promoted to Admin!");
            } else if (mode === 'members') {
                const q = query(collection(db as Firestore, "users"), where("email", "==", value.trim().toLowerCase()));
                const snap = await getDocs(q);
                if (snap.empty) throw new Error("No user found with that email.");
                if (!realmData?.id) throw new Error("Realm context missing.");

                const res = await fetch(`${API_BASE_URL}/${config.apiPath}/${realmData.id}/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newMemberId: snap.docs[0].id })
                });
                if (res.status === 409) throw new Error("User is already in this realm.");
                if (!res.ok) throw new Error("Onboarding failed.");
                toast.success("Member added!");
            } else {
                const res = await fetch(`${API_BASE_URL}/${config.apiPath}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [config.nameKey]: value, owner_id: user.uid, member_ids: [user.uid] })
                });
                if (!res.ok) throw new Error("Server rejected creation.");
                toast.success(`${config.label} Created!`);
            }
            
            setShowForm(false);
            if (onUpdate) onUpdate();
            fetchData();
        } finally {
            setIsProcessing(false); // 🟢 Stop Overlay
        }
    };

    const handleAction = async (id: string, action: string, name: string = "") => {
        if (!db) return;
        if (type === 'admin' && action === 'delete') {
            if (!confirm(`Remove admin privileges from ${name}?`)) return;
            setIsProcessing(true);
            try {
                await updateDoc(doc(db as Firestore, "users", id), { role: 'user' });
                toast.success("Privileges revoked.");
                fetchData();
            } finally { setIsProcessing(false); }
        } else if (action === 'delete') {
            setDeletingId(id);
            if (!confirm(`Delete "${name}"?`)) { setDeletingId(null); return; }
            setIsProcessing(true);
            try {
                const res = await fetch(`${API_BASE_URL}/${config.apiPath}/${id}`, { method: 'DELETE' });
                if (res.ok) { toast.success("Removed."); fetchData(); }
            } finally {
                setDeletingId(null);
                setIsProcessing(false);
            }
        }
    };

    const listSource = (config.dataSource === "firebase" || mode === "directory") ? items : members;
    const accentBtnClass = config.accent === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700';
    const accentTextClass = config.accent === 'purple' ? 'text-purple-600' : 'text-indigo-600';

    return (
        <div className="space-y-4 relative">
            {/* 🟢 Transparent Loading Overlay - Keeps UI intact */}
            {isProcessing && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
        {/* Changed type="full" to type="fullscreen" to satisfy TypeScript */}
        <UnifiedLoadingWidget type="fullscreen" message="Processing Matrix..." />
    </div>
)}

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {!showForm ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-700">{type === 'admin' ? config.memberPlural : (mode === 'directory' ? `My ${config.plural}` : config.memberPlural)}</h4>
                            <p className="text-xs text-slate-500">{type === 'admin' ? "System access management." : (mode === 'directory' ? "Overview of your active realms." : "Team access control.")}</p>
                        </div>
                        <button onClick={() => setShowForm(true)} className={`${accentBtnClass} text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-sm`}>
                            {Icons.Plus} {type === 'admin' ? 'Promote' : (mode === 'directory' ? `New ${config.label}` : `Add ${config.memberLabel}`)}
                        </button>
                    </div>
                ) : (
                    <ActionForm type={type} mode={mode} onConfirm={handleConfirm} onCancel={() => setShowForm(false)} />
                )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest sticky top-0 z-10">
                    Active {type === 'admin' ? config.memberPlural : (mode === 'directory' ? config.plural : config.memberPlural)} ({ listSource.length })
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-300 flex flex-col items-center gap-2">
                            <span className={`animate-spin ${accentTextClass}`}>{Icons.Loading}</span>
                            <span className="text-xs font-black uppercase tracking-tighter">Syncing Matrix...</span>
                        </div>
                    ) : listSource.length > 0 ? (
                        listSource.map(item => (
                            <div key={item.id || item.uid} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border 
                                        ${item.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                                          item.isOwner ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                        {(item[config.nameKey] || item.full_name || item.email || "U").substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-slate-700 leading-none">{item[config.nameKey] || item.full_name || item.email}</p>
                                            {item.role === 'admin' && <span className="text-purple-600 opacity-70">{Icons.Shield}</span>}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-tight">
                                            {type === 'admin' ? item.email : mode === 'directory' ? (item.isOwner ? '👑 Realm Owner' : `Shared by ${item.ownerDetails?.full_name}`) : item.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    {type === 'admin' ? (
                                        <button onClick={() => handleAction(item.id, 'delete', item.full_name)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">{Icons.Trash}</button>
                                    ) : mode === 'directory' ? (
                                        <>
                                            <button onClick={() => onEnterRealm?.(item)} className={`flex items-center gap-1 bg-white ${accentTextClass} text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-slate-200 hover:border-current transition-all`}>
                                                Enter {Icons.Enter}
                                            </button>
                                            {item.isOwner && (
                                                <button onClick={() => handleAction(item.id, 'delete', item[config.nameKey])} className={`p-2 transition-all ${deletingId === item.id ? 'text-rose-600 animate-pulse' : 'text-slate-300 hover:text-rose-600'}`}>
                                                    {deletingId === item.id ? Icons.Loading : Icons.Trash}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase tracking-tighter shadow-sm">Authorized</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-slate-400 text-xs font-medium italic">No entries found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(UnifiedManagerWidget);