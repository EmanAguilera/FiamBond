import { memo } from 'react';
import { CompanyRow } from './CompanyRow';

const CompanyLedgerListWidget = ({ transactions }) => {
    // Icon Helper
    const TxIcon = ({ type }) => (
        type === 'income' 
        ? <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path></svg>
        : <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"></path></svg>
    );

    return (
        <div className="max-h-[60vh] overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-slate-700 text-sm font-medium sticky top-0 z-10">
                Recent Financial Activity
            </div>

            {transactions && transactions.length > 0 ? (
                <div>
                    {transactions.map(tx => (
                        <CompanyRow 
                            key={tx.id}
                            title={tx.description}
                            subtitle={tx.created_at?.toDate().toLocaleDateString()}
                            icon={<TxIcon type={tx.type} />}
                            rightContent={
                                <span className={`font-bold font-mono ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {tx.type === 'income' ? '+' : '-'} ₱{parseFloat(tx.amount).toLocaleString()}
                                </span>
                            }
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center py-10 text-gray-500 italic">No transactions recorded.</p>
            )}
        </div>
    );
};

export default memo(CompanyLedgerListWidget);