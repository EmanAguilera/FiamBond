// FamilyRealm.jsx
import { useState, lazy, Suspense } from 'react';
import FamilyLedgerView from './FamilyLedgerView.jsx';
import LoanTrackingWidget from './LoanTrackingWidget.jsx';

const CreateLoanWidget = lazy(() => import('./CreateLoanWidget.jsx'));
const Modal = lazy(() => import('./Modal.jsx'));

export default function FamilyRealm({ family, onBack }) {
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    // This key is used to force a re-render of the LoanTrackingWidget after a new loan is created.
    const [loanWidgetKey, setLoanWidgetKey] = useState(Date.now());

    const handleLoanSuccess = () => {
        setIsLoanModalOpen(false);
        setLoanWidgetKey(Date.now()); // Update the key to trigger a refresh
    };

    return (
        <div className="p-4 md:p-10">
            {/* Header for the Family Realm */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <button onClick={onBack} className="secondary-btn-sm mb-2">&larr; Back to Personal Dashboard</button>
                    <h1 className="text-2xl font-bold text-slate-800">{family.first_name}: Family Realm</h1>
                </div>
                <button onClick={() => setIsLoanModalOpen(true)} className="primary-btn">+ Record a Loan</button>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {/* Reuse the existing ledger but hide its internal back button by passing an empty function */}
                    <FamilyLedgerView family={family} onBack={() => {}} />
                </div>
                <div className="lg:col-span-1">
                    <div className="dashboard-card">
                       <LoanTrackingWidget key={loanWidgetKey} family={family} />
                    </div>
                </div>
            </div>

            {/* Modal for Creating a Loan */}
            <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">Loading...</div>}>
                {isLoanModalOpen && (
                    <Modal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} title="Lend Money to a Family Member">
                        <CreateLoanWidget family={family} onSuccess={handleLoanSuccess} />
                    </Modal>
                )}
            </Suspense>
        </div>
    );
}