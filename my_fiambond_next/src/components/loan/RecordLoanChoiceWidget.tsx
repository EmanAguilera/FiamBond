'use client';

import React from 'react';

// 🏎️ Simplex Tip: Gumamit tayo ng Icons para sa mas mabilis na visual recognition
const FamilyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

interface RecordLoanChoiceWidgetProps {
    onSelectFamilyLoan: () => void;
    onSelectPersonalLoan: () => void;
}

export default function RecordLoanChoiceWidget({ onSelectFamilyLoan, onSelectPersonalLoan }: RecordLoanChoiceWidgetProps) {
    return (
        <div className="p-2 space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Record a New Loan</h3>
                <p className="text-sm text-slate-500 font-medium px-4">
                    Choose how you want to track this lending activity in your FiamBond ledger.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Family Loan Option */}
                <button 
                    onClick={onSelectFamilyLoan}
                    className="group flex flex-col items-center justify-center p-6 bg-indigo-50 border-2 border-indigo-100 rounded-3xl transition-all hover:border-indigo-400 hover:bg-indigo-100 active:scale-[0.97]"
                >
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                        <FamilyIcon />
                    </div>
                    <span className="mt-3 font-bold text-indigo-900">Family Member</span>
                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">In-App Tracking</span>
                </button>

                {/* Personal Loan Option */}
                <button 
                    onClick={onSelectPersonalLoan}
                    className="group flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl transition-all hover:border-slate-300 hover:bg-slate-100 active:scale-[0.97]"
                >
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-600 group-hover:scale-110 transition-transform">
                        <UserIcon />
                    </div>
                    <span className="mt-3 font-bold text-slate-900">External Individual</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manual Tracking</span>
                </button>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <p className="text-[11px] text-amber-700 font-semibold leading-relaxed text-center italic">
                    Note: Family loans require confirmation from the recipient, while personal loans are managed solely by you.
                </p>
            </div>
        </div>
    );
}