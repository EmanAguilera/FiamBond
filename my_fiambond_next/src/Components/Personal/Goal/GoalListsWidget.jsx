'use client'; // Required due to the use of hooks and dynamic imports

import { useContext, useEffect, useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { AppContext } from "../../../Context/AppContext.jsx";
import { API_BASE_URL } from '@/src/config/apiConfig';
import { db } from '../../../config/firebase-config.js';
import {
    collection,
    query,
    where,
    getDocs,
    documentId
} from 'firebase/firestore';

// --- DYNAMIC IMPORTS ---
const Modal = dynamic(() => import('../../Modal.jsx'), { ssr: false });
const CompleteGoalWidget = dynamic(() => import('./CompleteGoalWidget.tsx'), { ssr: false });

const GoalListsSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-4">
        <div className="flex gap-2 mb-6">
            <div className="h-10 w-1/2 bg-slate-100 rounded-xl animate-pulse"></div>
            <div className="h-10 w-1/2 bg-slate-50 rounded-xl animate-pulse"></div>
        </div>
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-slate-100 rounded-2xl space-y-3">
                    <div className="flex justify-between">
                        <div className="h-5 w-40 bg-slate-100 rounded animate-pulse"></div>
                        <div className="h-5 w-20 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                    <div className="h-3 w-32 bg-slate-50 rounded animate-pulse"></div>
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

    const getGoals = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setListError(null);
        try {
            const params = family ? `family_id=${family.id}` : `user_id=${user.uid}`;
            const response = await fetch(`${API_BASE_URL}/goals?${params}`);
            
            if (!response.ok) throw new Error('Failed to fetch goals');
            const rawGoals = await response.json();

            // Transform MongoDB data and shim .toDate() for compatibility
            const allGoals = rawGoals.map(g => ({
                ...g,
                id: g._id, 
                target_date: g.target_date ? { toDate: () => new Date(g.target_date) } : null,
                created_at: g.created_at ? { toDate: () => new Date(g.created_at) } : { toDate: () => new Date() },
                completed_at: g.completed_at ? { toDate: () => new Date(g.completed_at) } : null
            }));

            // Fetch user profiles from Firebase for enrichment
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
                creator_name: usersMap[goal.user_id]?.full_name || 'Member',
                completed_by_name: usersMap[goal.completed_by_user_id]?.full_name || 'Member'
            }));

            setActiveGoals(enrichedGoals.filter(g => g.status === 'active'));
            setCompletedGoals(enrichedGoals.filter(g => g.status === 'completed'));
        } catch (err) {
            console.error("Goal fetch error:", err);
            setListError("Could not load goals.");
        } finally {
            setLoading(false);
        }
    }, [user, family]);

    useEffect(() => {
        getGoals();
    }, [getGoals]);

    const handleMarkAsComplete = (goal) => {
        setGoalToComplete(goal);
        setIsCompleteModalOpen(true);
    };
    
    const handleCompletionSuccess = () => {
        setIsCompleteModalOpen(false);
        setGoalToComplete(null);
        getGoals(); 
        if (onDataChange) onDataChange();
    };

    const handleDeleteGoal = async (goalId) => {
        if (!window.confirm("Are you sure you want to abandon this goal?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/goals/${goalId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            getGoals(); 
            if (onDataChange) onDataChange();
        } catch {
            setListError("Could not delete the goal.");
        }
    };

    if (loading) return <GoalListsSkeleton />;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Tabs */}
            <div className="flex p-1.5 bg-slate-50/50 border-b border-slate-100">
                {['active', 'history'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)} 
                        className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                            activeTab === tab 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {tab === 'active' ? 'Active Goals' : 'Goal History'}
                    </button>
                ))}
            </div>

            <div className="max-h-[500px] overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'active' ? (
                    <div className="space-y-4">
                        {activeGoals.length > 0 ? activeGoals.map((goal) => {
                            const deadlineDate = goal.target_date?.toDate();
                            const isOverdue = deadlineDate && new Date() > deadlineDate;

                            return (
                                <div key={goal.id} className={`group border rounded-2xl p-4 transition-all hover:border-indigo-200 ${isOverdue ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-base">{goal.name}</h3>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">By {goal.creator_name}</span>
                                                {deadlineDate && (
                                                    <span className={`text-[10px] font-bold uppercase ${isOverdue ? 'text-rose-500' : 'text-indigo-400'}`}>
                                                        Due: {deadlineDate.toLocaleDateString()} {isOverdue && '(Overdue)'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-black text-indigo-600">
                                                ₱{parseFloat(goal.target_amount).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleDeleteGoal(goal.id)} 
                                            className="px-4 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50 rounded-lg uppercase tracking-widest transition-colors"
                                        >
                                            Abandon
                                        </button>
                                        <button 
                                            onClick={() => handleMarkAsComplete(goal)} 
                                            className="px-4 py-2 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg uppercase tracking-widest transition-all shadow-md shadow-indigo-100"
                                        >
                                            Complete
                                        </button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-12 text-center text-slate-400 italic text-sm">No active goals found.</div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {completedGoals.length > 0 ? completedGoals.map((goal) => (
                            <div key={goal.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                                <div className="flex justify-between items-center">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-500 line-through truncate">{goal.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                                            Achieved by {goal.completed_by_name} on {goal.completed_at?.toDate().toLocaleDateString()}
                                        </p>
                                        {goal.achievement_url && (
                                            <a 
                                                href={goal.achievement_url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="mt-2 inline-block text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                                            >
                                                View Proof
                                            </a>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className="block font-bold text-emerald-600">
                                            ₱{parseFloat(goal.target_amount).toLocaleString()}
                                        </span>
                                        <span className="text-[9px] uppercase font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Success</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-12 text-center text-slate-400 italic text-sm">History is empty.</div>
                        )}
                    </div>
                )}
            </div>

            <Suspense fallback={null}>
                {isCompleteModalOpen && goalToComplete && (
                    <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Goal Achievement">
                        <CompleteGoalWidget goal={goalToComplete} onSuccess={handleCompletionSuccess} />
                    </Modal>
                )}
            </Suspense>
        </div>
    );
}