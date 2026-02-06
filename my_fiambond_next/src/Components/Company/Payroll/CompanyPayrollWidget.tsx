'use client'; // Required due to the use of useState, useContext, and browser APIs (fetch)

import React, { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../../../Context/AppContext.jsx';
import { API_BASE_URL } from '../../../config/apiConfig.js';
import { toast } from 'react-hot-toast'; // Client-side library

interface Member {
    id: string;
    full_name: string;
    // other member properties
}

interface Props {
    company: { id: string | number };
    members: Member[];
    onSuccess?: () => void;
}

export default function CompanyPayrollWidget({ company, members, onSuccess }: Props) {
    const { user } = useContext(AppContext);

    const [activeTab, setActiveTab] = useState<'salary' | 'advance'>('salary'); // 'salary' or 'advance'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        employeeId: '',
        amount: '',
        notes: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
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

            const response = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionPayload)
            });

            if (!response.ok) throw new Error("Failed to process payroll transaction.");

            toast.success(`${typeLabel} recorded successfully.`);
            if (onSuccess) onSuccess();
            setFormData({ employeeId: '', amount: '', notes: '' });

        } catch (err) {
            console.error("Payroll Error:", err);
            setError("Failed to record transaction.");
            toast.error("Failed to record payroll.");
        } finally {
            setLoading(false);
        }
    };

    // Replicated input class from other widgets
    const inputClass = "w-full p-4 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium";
    const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1";

    return (
        <div className="space-y-5"> {/* Adjusted spacing to space-y-5 */}
            {/* Tabs - Replicated UI from CreateTransactionWidget */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
                <button 
                    onClick={() => setActiveTab('salary')} 
                    type="button" 
                    className={`py-2.5 rounded-lg font-bold transition-all ${activeTab === 'salary' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Run Salary
                </button>
                <button 
                    onClick={() => setActiveTab('advance')} 
                    type="button" 
                    className={`py-2.5 rounded-lg font-bold transition-all ${activeTab === 'advance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Cash Advance
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pt-2"> {/* Adjusted spacing to space-y-5 */}
                <div>
                    <label className={labelClass}>Select Employee</label> {/* Replicated label style */}
                    <select 
                        name="employeeId" 
                        value={formData.employeeId} 
                        onChange={handleInputChange} 
                        required
                        className={inputClass} // Replicated select style
                    >
                        <option value="">-- Choose Employee --</option>
                        {members.map(m => (
                            <option key={m.id} value={m.id}>{m.full_name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={labelClass}> {/* Replicated label style */}
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
                        className={inputClass} // Replicated input style
                    />
                </div>

                <div>
                    <label className={labelClass}>Notes / Period</label> {/* Replicated label style */}
                    <input 
                        type="text" 
                        name="notes" 
                        value={formData.notes} 
                        onChange={handleInputChange} 
                        placeholder={activeTab === 'salary' ? "e.g., September 15-30" : "e.g., Emergency fund"} 
                        className={inputClass} // Replicated input style
                    />
                </div>

                {activeTab === 'salary' && (
                    <div className="bg-emerald-50 p-3 rounded-xl text-xs text-emerald-700 border border-emerald-100">
                        This will generate a payroll expense in the company ledger and can be exported as a PDF invoice later.
                    </div>
                )}
                {activeTab === 'advance' && (
                    <div className="bg-indigo-50 p-3 rounded-xl text-xs text-indigo-700 border border-indigo-100">
                        This will be recorded as a company expense. Ensure you have an agreement for repayment.
                    </div>
                )}

                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                <button 
                    type="submit" 
                    disabled={loading}
                    // Replicated button style from CreateCompanyGoalWidget
                    className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'salary' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {loading ? (
                         <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : (activeTab === 'salary' ? 'Disburse Salary' : 'Grant Advance')}
                </button>
            </form>
        </div>
    );
}