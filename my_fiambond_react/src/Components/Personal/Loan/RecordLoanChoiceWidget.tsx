import React from 'react';

interface RecordLoanChoiceWidgetProps {
    onSelectFamilyLoan: () => void;
    onSelectPersonalLoan: () => void;
}

export default function RecordLoanChoiceWidget({ onSelectFamilyLoan, onSelectPersonalLoan }: RecordLoanChoiceWidgetProps) {
    return (
        <div className="p-4 space-y-4">
            <h3 className="text-xl font-semibold text-center text-gray-900">Record a New Loan</h3>
            <p className="text-center text-gray-600">
                Is this loan for a member of an existing family in Fiambond, or is it a personal loan to an individual?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                    onClick={onSelectFamilyLoan}
                    className="w-full primary-btn"
                >
                    For a Family Member
                </button>
                <button 
                    onClick={onSelectPersonalLoan}
                    className="w-full secondary-btn"
                >
                    To an Individual (Personal)
                </button>
            </div>
        </div>
    );
}