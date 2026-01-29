'use client'; // Required for all components using state, effects, or context in Next.js App Router

import { useState, useCallback, useContext, useEffect, memo } from 'react';
import { AppContext } from '../../../Context/AppContext';
import { db } from '../../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { toast } from 'react-hot-toast'; // Client-side library

// --- ICONS (Kept as is) ---
const Icons = {
    Enter: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>,
    Edit: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>,
    Trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
    Check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>,
    X: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
};

// --- INTERNAL COMPONENT: Create Family Form (Kept as is) ---
const CreateFamilyForm = ({ onAdd, onCancel }) => {
    const [familyName, setFamilyName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onAdd(familyName);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm mt-2">
            <p className="text-xs text-slate-500 mb-4">Name your new family realm.</p>
            <div className="mb-4">
                <input 
                    type="text" 
                    required 
                    value={familyName} 
                    onChange={(e) => setFamilyName(e.target.value)} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="e.g. The Smiths" 
                />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" disabled={loading} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create'}
                </button>
            </div>
        </form>
    );
};

// --- INTERNAL COMPONENT: Family Row (Kept as is) ---
const FamilyRow = ({ family, onEnter, onRename, onDelete }) => {
    const initials = (family.family_name || "F").substring(0, 2).toUpperCase();
    const isOwner = family.isOwner; 
    const ownerName = family.ownerDetails?.full_name || "Unknown";

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(family.family_name);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!editName.trim() || editName === family.family_name) {
            setIsEditing(false);
            return;
        }
        setLoading(true);
        const success = await onRename(family.id, editName);
        if (success) setIsEditing(false);
        setLoading(false);
    };

    const handleDelete = async () => {
        if(confirm(`Are you sure you want to delete "${family.family_name}"?`)) {
            setLoading(true);
            await onDelete(family.id);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors gap-4">
            {/* LEFT SIDE: Icon & Details */}
            <div className="flex items-center gap-3 flex-grow">
                <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold border ${isOwner ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {initials}
                </div>
                
                <div className="w-full">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="px-2 py-1 border border-slate-300 rounded text-sm w-full md:w-48 focus:ring-2 focus:ring-indigo-500 outline-none"
                                autoFocus
                                disabled={loading}
                            />
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm font-bold text-slate-700">{family.family_name}</p>
                            <p className="text-xs text-slate-400">
                                {isOwner ? 'Head of Household' : `Owner: ${ownerName}`}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT SIDE: Actions */}
            <div className="flex items-center gap-2 self-end md:self-auto">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} disabled={loading} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Save">
                            {Icons.Check}
                        </button>
                        <button onClick={() => { setIsEditing(false); setEditName(family.family_name); }} disabled={loading} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Cancel">
                            {Icons.X}
                        </button>
                    </>
                ) : (
                    <>
                        <button 
                            onClick={() => onEnter(family)}
                            className="flex items-center gap-1 bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-2 rounded-lg border border-indigo-100 hover:bg-indigo-100 hover:shadow-sm transition-all"
                        >
                            Enter <span className="hidden sm:inline">Realm</span> {Icons.Enter}
                        </button>

                        {isOwner && (
                            <div className="flex items-center border-l border-slate-200 pl-2 ml-1 gap-1">
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                                    title="Rename Family"
                                >
                                    {Icons.Edit}
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                                    title="Delete Family"
                                >
                                    {Icons.Trash}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// --- MAIN WIDGET ---
const ManageFamiliesWidget = ({ onEnterRealm }) => {
    const { user } = useContext(AppContext);
    // ⭐️ Next.js change: Replace import.meta.env.VITE_API_URL with process.env.NEXT_PUBLIC_API_URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const [families, setFamilies] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- HELPER: Check for Transactions (Kept as is, using updated API_URL) ---
    const checkHasTransactions = async (familyId) => {
        try {
            // Checks if this family has any transaction history
            const res = await fetch(`${API_URL}/transactions?family_id=${familyId}`);
            if (res.ok) {
                const transactions = await res.json();
                return transactions.length > 0;
            }
            return false; 
        } catch (error) {
            console.error("Error checking transactions:", error);
            return false; 
        }
    };

    const fetchFamilies = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/families?user_id=${user.uid}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const raw = await res.json();
            
            let mapped = raw.map(f => ({
                ...f,
                id: (f._id || f.id).toString(),
                isOwner: f.owner_id === user.uid
            }));

            const ownerIds = [...new Set(mapped.map(f => f.owner_id))];
            const ownersMap = {};

            if (ownerIds.length > 0) {
                const usersRef = collection(db, "users");
                const ownersQuery = query(usersRef, where(documentId(), "in", ownerIds.slice(0, 10))); 
                const ownersSnapshot = await getDocs(ownersQuery);
                ownersSnapshot.forEach(doc => { ownersMap[doc.id] = doc.data(); });
            }

            mapped = mapped.map(family => ({
                ...family,
                ownerDetails: ownersMap[family.owner_id] || { full_name: 'Unknown' }
            }));

            setFamilies(mapped);
        } catch (err) {
            console.error(err);
            toast.error("Could not load families.");
        } finally {
            setLoading(false);
        }
    }, [user, API_URL]);

    useEffect(() => { fetchFamilies(); }, [fetchFamilies]);

    const handleCreate = async (name) => {
        try {
            const res = await fetch(`${API_URL}/families`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    family_name: name,
                    owner_id: user.uid,
                    member_ids: [user.uid]
                })
            });

            if (!res.ok) throw new Error("Creation failed");
            toast.success("Family created successfully!");
            setShowCreateForm(false);
            fetchFamilies(); 
        } catch (err) {
            console.error(err);
            toast.error("Failed to create family.");
        }
    };

    // --- RENAME WITH VALIDATION (Kept as is, using updated API_URL) ---
    const handleRename = async (familyId, newName) => {
        // 1. Check for existing transactions first
        const hasTx = await checkHasTransactions(familyId);
        if (hasTx) {
            toast.error("Cannot rename family: Transactions exist.");
            return false;
        }

        try {
            const res = await fetch(`${API_URL}/families/${familyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ family_name: newName })
            });

            if (!res.ok) throw new Error("Update failed");
            toast.success("Family renamed.");
            fetchFamilies();
            return true;
        } catch (err) {
            console.error(err);
            toast.error("Failed to rename family.");
            return false;
        }
    };

    // --- DELETE WITH VALIDATION (Kept as is, using updated API_URL) ---
    const handleDelete = async (familyId) => {
        // 1. Check for existing transactions first
        const hasTx = await checkHasTransactions(familyId);
        if (hasTx) {
            toast.error("Cannot delete family: Transactions exist. Please archive instead.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/families/${familyId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error("Deletion failed");
            toast.success("Family deleted.");
            fetchFamilies();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete family.");
        }
    };

    return (
        <div className="space-y-4">
            {/* 1. TOP SECTION */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {!showCreateForm ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-700">My Families</h4>
                            <p className="text-xs text-slate-500">Manage household realms.</p>
                        </div>
                        <button 
                            onClick={() => setShowCreateForm(true)}
                            className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            Create Family
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-indigo-700 text-sm">Create New Family</h4>
                        </div>
                        <CreateFamilyForm onAdd={handleCreate} onCancel={() => setShowCreateForm(false)} />
                    </div>
                )}
            </div>

            {/* 2. LIST SECTION */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Available Realms ({families.length})</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[50vh] overflow-y-auto">
                     <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase sticky top-0 z-10">
                        Family Details
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading realms...</div>
                    ) : families.length > 0 ? (
                        families.map(family => (
                            <FamilyRow 
                                key={family.id} 
                                family={family} 
                                onEnter={onEnterRealm}
                                onRename={handleRename}
                                onDelete={handleDelete}
                            />
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm italic">
                            You are not part of any families yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(ManageFamiliesWidget);