'use client'; // Required due to the use of memo

import { memo } from 'react';

// Shared Row Component to match Admin aesthetic
const EmployeeRow = ({ member }) => {
    const initials = (member.full_name || member.first_name || "U").substring(0, 2).toUpperCase();
    
    return (
        <div className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-200">
                    {initials}
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-700">{member.full_name || member.first_name || "Unknown User"}</p>
                    <p className="text-xs text-slate-400">{member.email}</p>
                </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                Active
            </span>
        </div>
    );
};

const CompanyEmployeeListWidget = ({ members }) => {
    return (
        <div className="max-h-[50vh] overflow-y-auto bg-white">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase sticky top-0 z-10">
                Employee Details
            </div>
            
            {members && members.length > 0 ? (
                members.map(member => (
                    <EmployeeRow key={member.id} member={member} />
                ))
            ) : (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                    No employees found.
                </div>
            )}
        </div>
    );
};

export default memo(CompanyEmployeeListWidget);