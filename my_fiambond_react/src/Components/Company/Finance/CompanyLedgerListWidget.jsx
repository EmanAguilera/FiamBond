import { memo, useMemo } from 'react';

// --- STYLED SKELETON LOADER ---
const TransactionListSkeleton = () => (
    <div className="animate-pulse">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center p-4 border-b last:border-b-0 border-gray-100">
                <div className="h-10 w-10 rounded-full bg-slate-200"></div>
                <div className="ml-4 flex-grow">
                    <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
                    <div className="h-4 w-1/4 bg-slate-200 rounded mt-2"></div>
                </div>
                <div className="h-6 w-28 bg-slate-200 rounded"></div>
            </div>
        ))}
    </div>
);

// --- HELPER FUNCTION TO FORMAT DATE HEADERS ---
const formatDateHeader = (dateString) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = new Date(dateString);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
};

// --- STYLED TRANSACTION ITEM COMPONENT ---
const TransactionItem = ({ transaction }) => {
    const isIncome = transaction.type === 'income';

    // Same Icons as PersonalTransactionsWidget
    const Icon = () => (
        <svg className={`w-5 h-5 ${isIncome ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isIncome 
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path> 
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6"></path>
            }
        </svg>
    );

    const ReceiptIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );

    // Ensure we have a valid Date object
    const dateObj = transaction.created_at?.toDate 
        ? transaction.created_at.toDate() 
        : new Date(transaction.created_at || Date.now());

    return (
        <div className="flex items-center p-4 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition-colors duration-150">
            {/* Icon Circle */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                <Icon />
            </div>

            {/* Description & Metadata */}
            <div className="ml-4 flex-grow min-w-0">
                <p className="font-semibold text-gray-800 truncate">{transaction.description}</p>
                <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-gray-500">
                        {dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {transaction.attachment_url && (
                        <a 
                            href={transaction.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ReceiptIcon />
                            Receipt
                        </a>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div className={`ml-4 font-semibold text-right ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                {isIncome ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
        </div>
    );
};

const CompanyLedgerListWidget = ({ transactions, loading }) => {
    
    // Group transactions by Date
    const groupedTransactions = useMemo(() => {
        if (!transactions) return {};
        
        return transactions.reduce((acc, transaction) => {
            const dateObj = transaction.created_at?.toDate 
                ? transaction.created_at.toDate() 
                : new Date(transaction.created_at || Date.now());

            const dateKey = dateObj.toDateString();
            
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(transaction);
            return acc;
        }, {});
    }, [transactions]);

    // Loading State
    if (loading) return <TransactionListSkeleton />;

    // Empty State
    if (!transactions || transactions.length === 0) {
        return <div className="p-6 text-center text-gray-500 italic">No financial activity recorded.</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
                {Object.keys(groupedTransactions)
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                    .map(dateKey => (
                        <div key={dateKey}>
                            {/* Sticky Date Header */}
                            <h4 className="bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 border-b border-gray-200 sticky top-0 z-10">
                                {formatDateHeader(dateKey)}
                            </h4>
                            <div>
                                {groupedTransactions[dateKey].map(transaction => (
                                    <TransactionItem key={transaction.id || transaction._id} transaction={transaction} />
                                ))}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default memo(CompanyLedgerListWidget);