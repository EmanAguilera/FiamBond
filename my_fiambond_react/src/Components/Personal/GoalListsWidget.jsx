import { useContext, useEffect, useState, useCallback, lazy, Suspense } from "react";
import { AppContext } from "../../Context/AppContext.jsx";
import { db } from '../../config/firebase-config.js';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    deleteDoc,
    documentId,
    orderBy
} from 'firebase/firestore';

// --- LAZY LOADED COMPONENTS ---
const Modal = lazy(() => import('../Modal.jsx'));
const CompleteGoalWidget = lazy(() => import('./CompleteGoalWidget.tsx'));


// --- STYLED SKELETON LOADER ---
const GoalListsSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-8 w-1/3 bg-slate-200 rounded mb-4"></div>
        <div className="h-10 w-full bg-slate-200 rounded mb-6"></div>
        <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="h-6 w-48 bg-slate-200 rounded"></div>
                            <div className="h-4 w-32 bg-slate-200 rounded mt-3"></div>
                        </div>
                        <div className="h-7 w-28 bg-slate-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default function GoalListsWidget({ family, onDataChange }) {
    const { user } = useContext(AppContext);
    const [activeGoals, setActiveGoals] = useState([]);
    const [completedGoals, setCompletedGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [activeTab, setActiveTab] = useState('active');

    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [goalToComplete, setGoalToComplete] = useState(null);

    // --- Data Fetching Logic ---
    const getGoals = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setListError(null);
        try {
            let goalsQuery;
            if (family) {
                goalsQuery = query(collection(db, "goals"), where("family_id", "==", family.id), where("status", "in", ["active", "completed"]), orderBy("created_at", "desc"));
            } else {
                goalsQuery = query(collection(db, "goals"), where("family_id", "==", null), where("user_id", "==", user.uid), where("status", "in", ["active", "completed"]), orderBy("created_at", "desc"));
            }
            const goalsSnapshot = await getDocs(goalsQuery);
            const allGoals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const userIds = new Set();
            allGoals.forEach(goal => {
                if (goal.user_id) userIds.add(goal.user_id);
                if (goal.completed_by_user_id) userIds.add(goal.completed_by_user_id);
            });

            const usersMap = {};
            if (userIds.size > 0) {
                const usersQuery = query(collection(db, "users"), where(documentId(), "in", [...userIds]));
                const usersSnapshot = await getDocs(usersQuery);
                usersSnapshot.forEach(doc => usersMap[doc.id] = doc.data());
            }

            const enrichedGoals = allGoals.map(goal => ({
                ...goal,
                user: usersMap[goal.user_id] || { full_name: 'Unknown' },
                completed_by: usersMap[goal.completed_by_user_id]
            }));

            setActiveGoals(enrichedGoals.filter(g => g.status === 'active'));
            setCompletedGoals(enrichedGoals.filter(g => g.status === 'completed'));
        } catch (err) {
            console.error("Failed to get goals:", err);
            setListError("Could not load your goals.");
        } finally {
            setLoading(false);
        }
    }, [user, family]);

    useEffect(() => {
        getGoals();
    }, [getGoals]);

    function handleMarkAsComplete(goal) {
        setGoalToComplete(goal);
        setIsCompleteModalOpen(true);
    }
    
    // This is the handler that receives the signal from the child widget.
    const handleCompletionSuccess = () => {
        setIsCompleteModalOpen(false);
        setGoalToComplete(null);
        getGoals(); // 1. Refresh this component's data.

        // 2. Signal to the parent (Home.jsx) that it also needs to refresh.
        if (onDataChange) {
            onDataChange();
        }
    };

    async function handleDeleteGoal(goalId) {
        if (!window.confirm("Are you sure you want to abandon this goal? This action cannot be undone.")) return;
        setListError(null);
        try {
            await deleteDoc(doc(db, "goals", goalId));
            getGoals(); // Refresh this component's own list.

            // Also signal the parent in case deleting a goal affects the dashboard.
            if (onDataChange) {
                onDataChange();
            }
        } catch {
            setListError("Could not delete the goal.");
        }
    }

    if (loading) return <GoalListsSkeleton />;
    if (listError) return <p className="error text-center py-10">{listError}</p>;

    return (
        <div>
            {/* --- Tab Navigation UI --- */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveTab('active')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'active' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Active Goals
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Goal History
                    </button>
                </nav>
            </div>

            {/* --- Active Goals Tab --- */}
            {activeTab === 'active' && (
                <div>
                    {activeGoals.length > 0 ? (
                        <div className="space-y-4">
                            {activeGoals.map((goal) => {
                                const deadlineDate = goal.target_date?.toDate();
                                const isOverdue = deadlineDate && new Date() > deadlineDate;
                                return (
                                    <div key={goal.id} className={`bg-white border rounded-lg shadow-sm transition-all hover:shadow-md ${isOverdue ? 'border-yellow-400' : 'border-gray-200'}`}>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-lg text-gray-800 break-words">{goal.name}</h3>
                                                    <p className="text-sm font-semibold text-indigo-600">₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                                                        <p>Created by: <span className="font-medium text-gray-700">{goal.user.full_name}</span></p>
                                                        {deadlineDate && <p>Deadline: <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>{deadlineDate.toLocaleDateString()}</span></p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 px-4 py-2 rounded-b-lg flex justify-end items-center space-x-3">
                                            <button onClick={() => handleDeleteGoal(goal.id)} className="danger-btn-sm text-xs">Abandon</button>
                                            <button onClick={() => handleMarkAsComplete(goal)} className="success-btn-sm text-xs">Mark as Complete</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-gray-600 italic px-4">You have no active goals yet.</p>}
                </div>
            )}

            {/* --- Goal History Tab --- */}
            {activeTab === 'history' && (
                <div>
                    {completedGoals.length > 0 ? (
                        <div className="space-y-3">
                            {completedGoals.map((goal) => (
                                <div key={goal.id} className="bg-white border border-gray-200 rounded-lg p-4 opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-md text-gray-500 line-through break-words">{goal.name}</h3>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Completed by {goal.completed_by?.full_name || 'Unknown'} on {goal.completed_at?.toDate().toLocaleDateString()}
                                            </div>
                                            
                                            {goal.achievement_url && (
                                                <div className="mt-3">
                                                    <a
                                                        href={goal.achievement_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                                                    >
                                                        View Achievement
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4 text-right flex-shrink-0">
                                            <p className="font-bold text-md text-green-600">₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                            <p className="text-xs font-semibold text-green-600">Achieved</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-gray-600 italic px-4">You have not completed any goals yet.</p>}
                </div>
            )}

            {/* --- Modal for Completing a Goal --- */}
            <Suspense fallback={<div>Loading...</div>}>
                {isCompleteModalOpen && goalToComplete && (
                    <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Complete Your Goal">
                        <CompleteGoalWidget goal={goalToComplete} onSuccess={handleCompletionSuccess} />
                    </Modal>
                )}
            </Suspense>
        </div>
    );
}