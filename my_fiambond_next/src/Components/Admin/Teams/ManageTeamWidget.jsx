'use client'; // Required due to the use of useState

import { useState } from "react";
// Make sure this path points to your actual Table Widget location
import AdminUserTableWidget from "../Users/AdminUserTableWidget"; 
import { toast } from 'react-hot-toast'; // Client-side library

// --- INTERNAL COMPONENT: Add Admin Form ---
const AddAdminForm = ({ onAdd, onCancel }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // The onAdd function is expected to handle the Firebase/API logic
        await onAdd(email);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm mt-2">
            <p className="text-xs text-slate-500 mb-4">Enter user email to promote.</p>
            <div className="mb-4">
                <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" 
                    placeholder="user@example.com" 
                />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" disabled={loading} className="px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                    {loading ? 'Processing...' : 'Promote'}
                </button>
            </div>
        </form>
    );
};

// --- MAIN COMPONENT EXPORT ---
export default function ManageTeamWidget({ adminUsers, onAddAdmin }) {
    const [showAddForm, setShowAddForm] = useState(false);

    return (
        <div className="space-y-4">
            {/* 1. TOP SECTION: ACTION BUTTON OR FORM */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {!showAddForm ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-700">System Administrators</h4>
                            <p className="text-xs text-slate-500">Manage who has access to this dashboard.</p>
                        </div>
                        <button 
                            onClick={() => setShowAddForm(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-purple-700 transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            Promote New Admin
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                            <h4 className="font-bold text-purple-700">Promote User to Admin</h4>
                            <button onClick={() => setShowAddForm(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                        </div>
                        <AddAdminForm 
                            onAdd={async (email) => {
                                // Calls the onAddAdmin prop from the parent (AdminDashboard)
                                await onAddAdmin(email);
                                setShowAddForm(false); 
                            }} 
                            onCancel={() => setShowAddForm(false)} 
                        />
                    </div>
                )}
            </div>

            {/* 2. BOTTOM SECTION: LIST OF ADMINS */}
            <div className="mt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Current Admins ({adminUsers.length})</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* AdminUserTableWidget is expected to handle the rendering of AdminUserRows */}
                    <AdminUserTableWidget 
                        users={adminUsers} 
                        type="admin" // Pass type 'admin' to render in admin-specific mode
                        headerText={null} 
                        // onTogglePremium is not needed here as admins are not revoked/granted this way
                    />
                </div>
            </div>
        </div>
    );
}