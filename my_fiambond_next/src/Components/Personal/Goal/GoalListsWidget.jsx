'use client'; // Required due to the use of useState, useEffect, useCallback, useContext, and dynamic imports (lazy/Suspense)

import { useContext, useEffect, useState, useCallback, lazy, Suspense } from "react";
import dynamic from "next/dynamic"; // Use next/dynamic instead of React.lazy
import { AppContext } from "../../../Context/AppContext.jsx";
import { db } from '../../../config/firebase-config.js';
import {
    collection,
    query,
    where,
    getDocs,
    documentId
} from 'firebase/firestore';

// --- DYNAMIC IMPORTS (Replaced lazy with next/dynamic) ---
const Modal = dynamic(() => import('../../Modal.jsx'), { ssr: false });
const CompleteGoalWidget = dynamic(() => import('./CompleteGoalWidget.tsx'), { ssr: false });

const GoalListsSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden p-4">
        <div className="flex border-b border-slate-200 mb-4">
            <div className="h-10 w-1/2 bg-slate-100 rounded-t"></div>
            <div className="h-10 w-1/2 bg-white rounded-t"></div>
        </div>
        <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="h-6 w-48 bg-slate-200 rounded"></div>
                            <div className="h-4 w-32 bg-slate-100 rounded"></div>
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
    
    // ⭐️ Next.js change: Replace import.meta.env.VITE_API_URL with process.env.NEXT_PUBLIC_API_URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const getGoals = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setListError(null);
        try {
            let url = `${API_URL}/goals?`;
            if (family) {
                url += `family_id=${family.id}`;
            } else {
                url += `user_id=${user.uid}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch goals');
            
            const rawGoals = await response.json();

            // ⭐️ Goal Transformation Logic (Kept as is, essential for data compatibility)
            const allGoals = rawGoals.map(g => ({
                ...g,
                id: g._id, 
                target_date: g.target_date ? { toDate: () => new Date(g.target_date) } : null,
                created_at: g.created_at ? { toDate: () => new Date(g.created_at) } : { toDate: () => new Date() },
                completed_at: g.completed_at ? { toDate: () => new Date(g.completed_at) } : null
            }));

            const userIds = new Set();
            allGoals.forEach(goal => {
                if (goal.user_id) userIds.add(goal.user_id);
                if (goal.completed_by_user_id) userIds.add(goal.completed_by_user_id);
            });

            const usersMap = {};
            if (userIds.size > 0) {
                // NOTE: Firestore fetching is asynchronous but is compatible with Next.js client components
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
    }, [user, family, API_URL]);

    useEffect(() => {
        getGoals();
    }, [getGoals]);

    function handleMarkAsComplete(goal) {
        setGoalToComplete(goal);
        setIsCompleteModalOpen(true);
    }
    
    const handleCompletionSuccess = () => {
        setIsCompleteModalOpen(false);
        setGoalToComplete(null);
        getGoals(); 
        if (onDataChange) onDataChange();
    };

    async function handleDeleteGoal(goalId) {
        if (!window.confirm("Are you sure you want to abandon this goal?")) return;
        setListError(null);
        try {
            const response = await fetch(`${API_URL}/goals/${goalId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete');
            getGoals(); 
            if (onDataChange) onDataChange();
        } catch {
            setListError("Could not delete the goal.");
        }
    }

    if (loading) return <GoalListsSkeleton />;
    if (listError) return <p className="text-center text-rose-500 py-10 bg-rose-50 rounded-lg border border-rose-100">{listError}</p>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('active')} 
                    className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'active' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Active Goals
                </button>
                <button 
                    onClick={() => setActiveTab('history')} 
                    className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Goal History
                </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
                {activeTab === 'active' && (
                    <div className="space-y-4">
                        {activeGoals.length > 0 ? activeGoals.map((goal) => {
                            const deadlineDate = goal.target_date?.toDate();
                            const isOverdue = deadlineDate && new Date() > deadlineDate;

                            return (
                                <div key={goal.id} className={`bg-white border rounded-lg p-4 shadow-sm transition-all hover:shadow-md ${isOverdue ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">{goal.name}</h3>
                                            <div className="text-xs text-slate-500 mt-1 flex flex-col gap-1">
                                                <span>Created by: {goal.user.full_name}</span>
                                                <div className="flex gap-2">
                                                    {deadlineDate && (
                                                        <span>Deadline: <strong>{deadlineDate.toLocaleDateString()}</strong></span>
                                                    )}
                                                    {isOverdue && <span className="text-amber-600 font-bold">(Overdue)</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-indigo-600 text-lg">
                                                ₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                        <button 
                                            onClick={() => handleDeleteGoal(goal.id)} 
                                            className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded transition-colors"
                                        >
                                            Abandon
                                        </button>
                                        <button 
                                            onClick={() => handleMarkAsComplete(goal)} 
                                            className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors shadow-sm"
                                        >
                                            Mark Complete
                                        </button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-center text-slate-400 italic py-6">You have no active goals yet.</p>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-3">
                        {completedGoals.length > 0 ? completedGoals.map((goal) => (
                            <div key={goal.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 opacity-75 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-slate-600 line-through text-lg">{goal.name}</h3>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            Completed by {goal.completed_by?.full_name || 'Unknown'} <br/>
                                            on {goal.completed_at?.toDate().toLocaleDateString()}
                                        </div>
                                        {goal.achievement_url && (
                                            <a 
                                                href={goal.achievement_url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="mt-2 inline-flex items-center text-xs font-bold text-emerald-600 hover:underline"
                                            >
                                                View Achievement
                                            </a>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-emerald-600">
                                            ₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-1.5 rounded">Achieved</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-slate-400 italic py-6">You have not completed any goals yet.</p>
                        )}
                    </div>
                )}
            </div>

            <Suspense fallback={null}>
                {isCompleteModalOpen && goalToComplete && (
                    <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Complete Your Goal">
                        <CompleteGoalWidget goal={goalToComplete} onSuccess={handleCompletionSuccess} />
                    </Modal>
                )}
            </Suspense>
        </div>
    );
}