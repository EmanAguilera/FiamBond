import { useState, useContext } from 'react';
import { AppContext } from '../../../Context/AppContext';
import { toast } from 'react-hot-toast';

export default function CreateCompanyTransactionWidget({ company, onSuccess }) {
    const { user } = useContext(AppContext);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'income', // 'income' = Revenue, 'expense' = Cost
        date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.description) return;
        setLoading(true);

        try {
            const payload = {
                user_id: user.uid, // Who recorded it
                company_id: company.id, // Which company
                description: formData.description,
                amount: parseFloat(formData.amount),
                type: formData.type,
                created_at: new Date(formData.date).toISOString()
            };

            const res = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to record transaction");

            toast.success(formData.type === 'income' ? "Revenue Recorded" : "Expense Recorded");
            if (onSuccess) onSuccess();
            
            // Reset form
            setFormData({ description: '', amount: '', type: 'income', date: new Date().toISOString().split('T')[0] });

        } catch (error) {
            console.error(error);
            toast.error("Error saving record");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`py-3 rounded-lg font-bold border transition ${
                        formData.type === 'income' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    + Revenue
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`py-3 rounded-lg font-bold border transition ${
                        formData.type === 'expense' 
                        ? 'bg-rose-50 border-rose-500 text-rose-700' 
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    - Expense
                </button>
            </div>

            {/* Amount */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount (₱)</label>
                <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg font-mono"
                    placeholder="0.00"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <input 
                    type="text" 
                    required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder={formData.type === 'income' ? "e.g., Client Payment, Sales" : "e.g., Office Rent, Server Costs"}
                />
            </div>

            {/* Date */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 mt-4"
            >
                {loading ? 'Recording...' : 'Save Record'}
            </button>
        </form>
    );
}