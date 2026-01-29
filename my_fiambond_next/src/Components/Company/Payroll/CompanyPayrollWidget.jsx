'use client'; // Required due to the use of useState, useContext, and browser APIs (fetch)

import { useState, useContext } from 'react';
import { AppContext } from '../../../Context/AppContext.jsx';
import { toast } from 'react-hot-toast'; // Client-side library

export default function CompanyPayrollWidget({ company, members, onSuccess }) {
    const { user } = useContext(AppContext);
    // ⭐️ Next.js change: Replace import.meta.env.VITE_API_URL with process.env.NEXT_PUBLIC_API_URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const [activeTab, setActiveTab] = useState('salary'); // 'salary' or 'advance'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        employeeId: '',
        amount: '',
        notes: ''
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.employeeId) {
            setError("Please select an employee.");
            setLoading(false);
            return;
        }

        const employee = members.find(m => m.id === formData.employeeId);
        const typeLabel = activeTab === 'salary' ? 'Salary Payment' : 'Cash Advance';
        
        try {
            const transactionPayload = {
                user_id: user.uid, // Recorded by Admin
                company_id: company.id,
                type: 'expense', // Both are expenses for the company
                amount: Number(formData.amount),
                description: `${typeLabel} for ${employee?.full_name || 'Employee'} - ${formData.notes}`,
                category: activeTab === 'salary' ? 'Payroll' : 'Cash Advance',
                date: new Date().toISOString() // Use ISO string
            };

            const response = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionPayload)
            });

            if (!response.ok) throw new Error("Failed to process payroll transaction.");

            toast.success(`${typeLabel} recorded successfully.`);
            if (onSuccess) onSuccess();
            setFormData({ employeeId: '', amount: '', notes: '' });

        } catch (err) {
            console.error(err);
            setError("Failed to record transaction.");
            toast.error("Failed to record payroll.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('salary')} 
                    type="button" // Use type="button" to prevent form submission
                    className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'salary' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Run Salary
                </button>
                <button 
                    onClick={() => setActiveTab('advance')} 
                    type="button" // Use type="button"
                    className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'advance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Cash Advance
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                    <select 
                        name="employeeId" 
                        value={formData.employeeId} 
                        onChange={handleInputChange} 
                        required
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">-- Choose Employee --</option>
                        {members.map(m => (
                            <option key={m.id} value={m.id}>{m.full_name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {activeTab === 'salary' ? 'Net Salary Amount (₱)' : 'Advance Amount (₱)'}
                    </label>
                    <input 
                        type="number" 
                        name="amount" 
                        value={formData.amount} 
                        onChange={handleInputChange} 
                        required 
                        min="0"
                        step="0.01"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Period</label>
                    <input 
                        type="text" 
                        name="notes" 
                        value={formData.notes} 
                        onChange={handleInputChange} 
                        placeholder={activeTab === 'salary' ? "e.g., September 15-30" : "e.g., Emergency fund"} 
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                {activeTab === 'salary' && (
                    <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-700">
                        This will generate a payroll expense in the company ledger and can be exported as a PDF invoice later.
                    </div>
                )}
                {activeTab === 'advance' && (
                    <div className="bg-amber-50 p-3 rounded-md text-xs text-amber-700">
                        This will be recorded as a company expense. Ensure you have an agreement for repayment.
                    </div>
                )}

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full py-2.5 rounded-xl font-bold text-white shadow-md transition-all active:scale-95 ${activeTab === 'salary' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {loading ? 'Processing...' : activeTab === 'salary' ? 'Disburse Salary' : 'Grant Advance'}
                </button>
            </form>
        </div>
    );
}