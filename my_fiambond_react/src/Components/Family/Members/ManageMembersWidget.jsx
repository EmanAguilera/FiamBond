import { useState, memo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import { toast } from 'react-hot-toast'; 

// --- INTERNAL COMPONENT: Add Member Form ---
const AddMemberForm = ({ onAdd, onCancel }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onAdd(email);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm mt-2">
            <p className="text-xs text-slate-500 mb-4">Enter user email to invite.</p>
            <div className="mb-4">
                <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="relative@example.com" 
                />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" disabled={loading} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? 'Inviting...' : 'Invite'}
                </button>
            </div>
        </form>
    );
};

// --- INTERNAL COMPONENT: Member Row ---
const MemberRow = ({ member }) => {
    const initials = (member.full_name || member.first_name || "U").substring(0, 2).toUpperCase();
    
    return (
        <div className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold border border-teal-200">
                    {initials}
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-700">{member.full_name || member.first_name || "Unknown User"}</p>
                    <p className="text-xs text-slate-400">{member.email}</p>
                </div>
            </div>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-100">
                Family
            </span>
        </div>
    );
};

// --- MAIN WIDGET ---
const ManageMembersWidget = ({ family, members, onUpdate }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddMember = async (email) => {
        try {
            // 1. Find User in Firebase
            const q = query(collection(db, "users"), where("email", "==", email));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                toast.error("User email not found in system.");
                return;
            }

            const newUser = snapshot.docs[0].data();
            const newUserId = snapshot.docs[0].id;

            // 2. Add to Family in MongoDB
            const res = await fetch(`${API_URL}/families/${family.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newMemberId: newUserId })
            });

            if (res.status === 409) throw new Error("User is already a member.");
            if (!res.ok) throw new Error("Failed to add member.");

            toast.success(`${newUser.full_name || "User"} added successfully!`);
            if (onUpdate) onUpdate();
            setShowAddForm(false);

        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-4">
            {/* 1. TOP SECTION: ACTION BUTTON OR FORM */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {!showAddForm ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-700">Family Members</h4>
                            <p className="text-xs text-slate-500">Manage household access.</p>
                        </div>
                        <button 
                            onClick={() => setShowAddForm(true)}
                            className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            Invite Member
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-indigo-700 text-sm">Invite New Member</h4>
                        </div>
                        <AddMemberForm onAdd={handleAddMember} onCancel={() => setShowAddForm(false)} />
                    </div>
                )}
            </div>

            {/* 2. BOTTOM SECTION: LIST */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Current Household ({members.length})</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[50vh] overflow-y-auto">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase sticky top-0 z-10">
                        Member Details
                    </div>
                    {members && members.length > 0 ? (
                        members.map(member => (
                            <MemberRow key={member.id} member={member} />
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm italic">
                            No members found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(ManageMembersWidget);