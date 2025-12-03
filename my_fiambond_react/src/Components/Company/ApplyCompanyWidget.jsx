import { useContext } from "react";
import { AppContext } from "../../Context/AppContext";

export default function ApplyCompanyWidget({ onClose }) {
    const { user } = useContext(AppContext);

    return (
        <div className="text-center p-6">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Unlock Company Realm</h3>
            <p className="text-gray-600 mb-6">
                Hi <strong>{user.first_name}</strong>! The Company Realm is a Premium feature designed for business owners to manage payroll, expenses, and revenue.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-left text-sm">
                <p className="font-bold text-slate-700 mb-2">Benefits include:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Separate Business Ledger</li>
                    <li>Employee Payroll Management</li>
                    <li>Revenue vs Expense Reporting</li>
                    <li>Business Goal Tracking</li>
                </ul>
            </div>

            <button 
                onClick={onClose} // In a real app, this might send a request to Admin
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
            >
                Contact Admin to Upgrade
            </button>
        </div>
    );
}