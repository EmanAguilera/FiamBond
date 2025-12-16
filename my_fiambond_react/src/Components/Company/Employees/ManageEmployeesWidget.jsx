import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase-config';
import { toast } from 'react-hot-toast';

export default function ManageEmployeesWidget({ company, members, onUpdate }) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [employeeList, setEmployeeList] = useState(members || []);

    // Sync props to state
    useEffect(() => { setEmployeeList(members); }, [members]);

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Find User in Firebase
            const q = query(collection(db, "users"), where("email", "==", email));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                toast.error("User email not found in FiamBond system.");
                setLoading(false);
                return;
            }

            const newUser = snapshot.docs[0].data();
            const newUserId = snapshot.docs[0].id; // The UID

            // 2. Add to Company in MongoDB
            const res = await fetch(`${API_URL}/companies/${company.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newMemberId: newUserId })
            });

            if (res.status === 409) throw new Error("User is already an employee.");
            if (!res.ok) throw new Error("Failed to add employee.");

            toast.success(`${newUser.full_name || newUser.first_name} added!`);
            setEmail('');
            if (onUpdate) onUpdate(); // Refresh parent

        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Add Form */}
            <form onSubmit={handleAddEmployee} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Onboard New Employee</label>
                <div className="flex gap-2">
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="employee@email.com"
                        className="flex-grow px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Adding...' : 'Add'}
                    </button>
                </div>
            </form>

            {/* List */}
            <h4 className="font-bold text-gray-800 mb-3">Current Workforce ({employeeList.length})</h4>
            <div className="max-h-60 overflow-y-auto border-t border-gray-100">
                {employeeList.length > 0 ? employeeList.map((member) => (
                    <div key={member.id} className="flex items-center p-3 border-b border-gray-100 last:border-0">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-xs">
                            {(member.full_name || member.first_name || "U").substring(0,2).toUpperCase()}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-bold text-gray-800">{member.full_name || member.first_name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                        <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Active</span>
                    </div>
                )) : (
                    <p className="text-center py-4 text-gray-500 text-sm">No employees found.</p>
                )}
            </div>
        </div>
    );
}