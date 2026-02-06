'use client'; // Required due to the use of hooks and dynamic imports

import React, { useContext, useEffect, useState, useCallback, Suspense } from "react";
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
import { toast } from 'react-hot-toast';

// --- DYNAMIC IMPORTS ---
const Modal = dynamic(() => import('../../Modal.jsx'), { ssr: false });
const CompleteGoalWidget = dynamic(() => import('./CompleteGoalWidget.tsx'), { ssr: false });

const GoalListsSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl mb-6">
            <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse"></div>
            <div className="h-10 w-full bg-slate-50 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div className="h-6 w-3/5 bg-slate-100 rounded-lg animate-pulse"></div>
                        <div className="h-6 w-1/5 bg-slate-100 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="h-3 w-1/4 bg-slate-50 rounded animate-pulse"></div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <div className="h-8 w-1/4 bg-slate-100 rounded-lg animate-pulse"></div>
                        <div className="h-8 w-1/4 bg-indigo-100 rounded-lg animate-pulse"></div>
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
                const idsArray = Array.from(userIds);
                const chunks = [];
                for (let i = 0; i < idsArray.length; i += 10) {
                    chunks.push(idsArray.slice(i, i + 10));
                }

                for (const chunk of chunks) {
                    if (chunk.length === 0) continue;
                    const usersQuery = query(collection(db, "users"), where(documentId(), "in", chunk));
                    const usersSnapshot = await getDocs(usersQuery);
                    usersSnapshot.forEach(doc => usersMap[doc.id] = doc.data());
                }
            }

            const enrichedGoals = allGoals.map(goal => ({
                ...goal,
                creator_name: usersMap[goal.user_id]?.full_name || usersMap[goal.user_id]?.display_name || 'Member',
                completed_by_name: usersMap[goal.completed_by_user_id]?.full_name || usersMap[goal.completed_by_user_id]?.display_name || 'Member'
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
        if (!window.confirm("Are you sure you want to abandon this goal? This action cannot be undone.")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/goals/${goalId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            toast.success("Goal abandoned.");
            getGoals(); 
            if (onDataChange) onDataChange();
        } catch (e) {
            console.error("Delete error:", e);
            setListError("Could not delete the goal.");
            toast.error("Failed to abandon goal.");
        }
    };

    if (loading) return <GoalListsSkeleton />;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-lg"> {/* Updated container style */}
            {/* Tabs - Replicated UI from other widgets */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-t-2xl border-b border-slate-200">
                {['active', 'history'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)} 
                        className={`py-2.5 rounded-lg font-bold transition-all ${
                            activeTab === tab 
                            ? 'bg-white text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-indigo-700'
                        }`}
                    >
                        {tab === 'active' ? 'Active Goals' : 'Goal History'}
                    </button>
                ))}
            </div>

            {listError && <p className="text-center text-rose-500 p-4">{listError}</p>}

            <div className="max-h-[500px] overflow-y-auto p-4">
                {activeTab === 'active' ? (
                    <div className="space-y-4">
                        {activeGoals.length > 0 ? activeGoals.map((goal) => {
                            const deadlineDate = goal.target_date?.toDate();
                            const isOverdue = deadlineDate && new Date() > deadlineDate;

                            return (
                                <div key={goal.id} className={`bg-white border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${isOverdue ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 text-xl">{goal.name}</h3>
                                            <div className="text-xs text-slate-500 mt-2 flex flex-col gap-1">
                                                <span>Created by: <span className="font-semibold text-slate-700">{goal.creator_name}</span></span>
                                                <div className="flex items-center gap-2">
                                                    <span>Deadline: <strong className="text-slate-700">{deadlineDate?.toLocaleDateString()}</strong></span>
                                                    {isOverdue && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700">(OVERDUE)</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-extrabold text-indigo-600 text-2xl">
                                                ₱{parseFloat(goal.target_amount).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
                                        <button 
                                            onClick={() => handleDeleteGoal(goal.id)} 
                                            className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors active:scale-95"
                                        >
                                            Abandon
                                        </button>
                                        <button 
                                            onClick={() => handleMarkAsComplete(goal)} 
                                            className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-md shadow-indigo-100 active:scale-95"
                                        >
                                            Mark Complete
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
                            <div key={goal.id} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 opacity-90 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-center">
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-slate-600 text-lg line-through truncate">{goal.name}</h3>
                                        <p className="text-xs text-emerald-600 mt-1">
                                            Achieved by <span className="font-bold">{goal.completed_by_name}</span> on {goal.completed_at?.toDate().toLocaleDateString()}
                                        </p>
                                        {goal.achievement_url && (
                                            <a 
                                                href={goal.achievement_url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="mt-2 inline-block text-xs font-bold text-indigo-600 hover:underline bg-white px-2 py-1 rounded-full shadow-sm"
                                            >
                                                View Proof
                                            </a>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className="block font-bold text-emerald-700 text-xl">
                                            ₱{parseFloat(goal.target_amount).toLocaleString()}
                                        </span>
                                        <span className="text-[10px] uppercase font-black text-white bg-emerald-600 px-2 py-0.5 rounded-full mt-1 inline-block">Success</span>
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