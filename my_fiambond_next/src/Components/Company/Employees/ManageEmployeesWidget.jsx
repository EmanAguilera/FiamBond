'use client'; // Required due to the use of useState and Firebase client-side SDK

import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import { toast } from 'react-hot-toast';
import CompanyEmployeeListWidget from './CompanyEmployeeListWidget';

// --- INTERNAL COMPONENT: Add Employee Form (Kept as is) ---
const AddEmployeeForm = ({ onAdd, onCancel }) => {
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
            <p className="text-xs text-slate-500 mb-4">Enter user email to onboard.</p>
            <div className="mb-4">
                <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="employee@example.com" 
                />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" disabled={loading} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? 'Onboarding...' : 'Onboard'}
                </button>
            </div>
        </form>
    );
};

// --- MAIN WIDGET ---
export default function ManageEmployeesWidget({ company, members, onUpdate }) {
    // ⭐️ Next.js change: Replace import.meta.env.VITE_API_URL with process.env.NEXT_PUBLIC_API_URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddEmployee = async (email) => {
        try {
            // 1. Find User in Firebase (Client-side compatible)
            const q = query(collection(db, "users"), where("email", "==", email));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                toast.error("User email not found in system.");
                return;
            }

            const newUser = snapshot.docs[0].data();
            const newUserId = snapshot.docs[0].id;

            // 2. Add to Company in MongoDB
            const res = await fetch(`${API_URL}/companies/${company.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newMemberId: newUserId })
            });

            if (res.status === 409) throw new Error("User is already an employee.");
            if (!res.ok) throw new Error("Failed to add employee.");

            toast.success(`${newUser.full_name || "User"} added successfully!`);
            if (onUpdate) onUpdate();
            setShowAddForm(false);

        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to onboard employee.");
        }
    };

    return (
        <div className="space-y-4">
            {/* 1. TOP SECTION: ACTION BUTTON OR FORM */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {!showAddForm ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-700">Company Workforce</h4>
                            <p className="text-xs text-slate-500">Manage employee access.</p>
                        </div>
                        <button 
                            onClick={() => setShowAddForm(true)}
                            className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            Onboard Employee
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-indigo-700 text-sm">Onboard New Employee</h4>
                        </div>
                        <AddEmployeeForm onAdd={handleAddEmployee} onCancel={() => setShowAddForm(false)} />
                    </div>
                )}
            </div>

            {/* 2. BOTTOM SECTION: LIST OF EMPLOYEES */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Active Team ({members.length})</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <CompanyEmployeeListWidget members={members} />
                </div>
            </div>
        </div>
    );
}