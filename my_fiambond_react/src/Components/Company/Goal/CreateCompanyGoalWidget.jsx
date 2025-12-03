import { useState, useContext } from 'react';
import { AppContext } from '../../../Context/AppContext';
import { toast } from 'react-hot-toast';

export default function CreateCompanyGoalWidget({ company, onSuccess }) {
    const { user } = useContext(AppContext);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const [formData, setFormData] = useState({
        name: '',
        target_amount: '',
        target_date: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                user_id: user.uid, // Created by
                company_id: company.id, // Belonging to Company
                name: formData.name,
                target_amount: parseFloat(formData.target_amount),
                target_date: new Date(formData.target_date).toISOString()
            };

            const res = await fetch(`${API_URL}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create goal");

            toast.success("Strategic Target Set!");
            if (onSuccess) onSuccess();
            setFormData({ name: '', target_amount: '', target_date: '' });

        } catch (error) {
            console.error(error);
            toast.error("Error creating target");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Target Name</label>
                <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    placeholder="e.g., Q4 Revenue Target"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Target Amount (₱)</label>
                <input 
                    type="number" 
                    required
                    value={formData.target_amount}
                    onChange={e => setFormData({...formData, target_amount: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                    placeholder="500000"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Deadline</label>
                <input 
                    type="date" 
                    required
                    value={formData.target_date}
                    onChange={e => setFormData({...formData, target_date: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition disabled:opacity-50 mt-2"
            >
                {loading ? 'Setting Target...' : 'Set Target'}
            </button>
        </form>
    );
}