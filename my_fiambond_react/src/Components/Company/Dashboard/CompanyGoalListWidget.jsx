import { memo } from 'react';
import { CompanyRow } from './CompanyRow';

const CompanyGoalListWidget = ({ goals }) => {
    const GoalIcon = () => <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2z"></path></svg>;

    return (
        <div className="max-h-[60vh] overflow-y-auto">
            <div className="px-4 py-3 bg-rose-50 border-b border-rose-100 text-rose-800 text-sm font-medium sticky top-0 z-10">
                Strategic Targets
            </div>

            {goals && goals.length > 0 ? (
                <div>
                    {goals.map(goal => (
                        <CompanyRow 
                            key={goal.id || goal._id}
                            title={goal.name}
                            subtitle={`Target: ${new Date(goal.target_date).toLocaleDateString()}`}
                            icon={<GoalIcon />}
                            rightContent={
                                <div className="flex flex-col items-end">
                                    <span className="font-bold text-gray-700">₱{parseFloat(goal.target_amount).toLocaleString()}</span>
                                    <span className={`text-[10px] uppercase font-bold px-1.5 rounded ${goal.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {goal.status}
                                    </span>
                                </div>
                            }
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center py-10 text-gray-500 italic">No active goals.</p>
            )}
        </div>
    );
};

export default memo(CompanyGoalListWidget);