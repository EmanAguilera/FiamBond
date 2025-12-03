import { memo } from 'react';
import { CompanyRow } from './CompanyRow';

const CompanyEmployeeListWidget = ({ members }) => {
    return (
        <div className="max-h-[60vh] overflow-y-auto">
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 text-amber-800 text-sm font-medium sticky top-0 z-10">
                Active Workforce
            </div>

            {members && members.length > 0 ? (
                <div>
                    {members.map(member => {
                        const initials = (member.full_name || member.first_name || "U").substring(0, 2).toUpperCase();
                        return (
                            <CompanyRow 
                                key={member.id}
                                title={member.full_name || member.first_name}
                                subtitle={member.email}
                                icon={initials} // Will render as text in the circle
                                rightContent={
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                        Active
                                    </span>
                                }
                            />
                        );
                    })}
                </div>
            ) : (
                <p className="text-center py-10 text-gray-500 italic">No employees found.</p>
            )}
        </div>
    );
};

export default memo(CompanyEmployeeListWidget);