'use client';

import { useState, useCallback, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/src/config/firebase-config";
import { API_BASE_URL } from "@/src/config/apiConfig";

/**
 * useRealmData Hook
 * Centralizes data fetching for Admin, Personal, and Company realms.
 * Fixed: Added resilient fetching to handle backend connectivity issues.
 */
export function useRealmData(user, realmType, entityId = null) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('monthly');
    
    // Realm States
    const [transactions, setTransactions] = useState([]);
    const [summaryData, setSummaryData] = useState({ netPosition: 0 });
    const [report, setReport] = useState(null);
    
    // Admin Specific States
    const [users, setUsers] = useState([]);
    const [premiums, setPremiums] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [totalFunds, setTotalFunds] = useState(0);

    // Personal/Company Specific States
    const [activeGoalsCount, setActiveGoalsCount] = useState(0);
    const [outstandingLending, setOutstandingLending] = useState(0);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            if (realmType === 'admin') {
                // --- ADMIN FETCH LOGIC (Firestore - Always works if Firebase is up) ---
                const [uSnap, pSnap] = await Promise.all([
                    getDocs(collection(db, "users")),
                    getDocs(collection(db, "premiums"))
                ]);

                const usersList = uSnap.docs.map(u => ({ id: u.id, ...u.data() }));
                const premiumsList = pSnap.docs.map(p => ({ id: p.id, ...p.data() }));

                setUsers(usersList);
                setPremiums(premiumsList);
                setPendingCount(usersList.filter(u => 
                    u.subscription_status === 'pending_approval' || 
                    u.family_subscription_status === 'pending_approval'
                ).length);
                
                const total = premiumsList.reduce((sum, p) => p.user_id === user.uid ? sum : sum + (p.amount || 0), 0);
                setTotalFunds(total);

            } else {
                // --- PERSONAL/COMPANY FETCH LOGIC (External API) ---
                const queryParam = realmType === 'personal' ? `user_id=${user.uid}` : `${realmType}_id=${entityId}`;
                
                /**
                 * Helper function to handle individual fetch failures.
                 * This prevents one failed API call from stopping the whole app.
                 */
                const safeFetch = async (endpoint) => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return await response.json();
                    } catch (e) {
                        console.error(`Fetch error for ${endpoint}:`, e);
                        return null; // Return null if server is down or route fails
                    }
                };

                // Execute all fetches in parallel
                const [txData, goalsData, loansData] = await Promise.all([
                    safeFetch(`transactions?${queryParam}`),
                    safeFetch(`goals?${queryParam}`),
                    safeFetch(`loans?${queryParam}`)
                ]);

                // 1. Process Transactions
                if (txData) {
                    const filtered = realmType === 'personal' ? txData.filter(tx => !tx.family_id) : txData;
                    setTransactions(filtered);
                    
                    let balance = 0;
                    filtered.forEach(tx => tx.type === 'income' ? balance += tx.amount : balance -= tx.amount);
                    setSummaryData({ netPosition: balance });
                }

                // 2. Process Goals
                if (goalsData) {
                    setActiveGoalsCount(goalsData.filter(g => g.status === 'active').length);
                }

                // 3. Process Loans
                if (loansData) {
                    let out = 0;
                    loansData.forEach(l => {
                        const isCreditor = realmType === 'personal' ? l.creditor_id === user.uid : true;
                        if (isCreditor && (l.status === 'outstanding' || l.status === 'pending_confirmation')) {
                            out += ((l.total_owed || l.amount) - (l.repaid_amount || 0));
                        }
                    });
                    setOutstandingLending(out);
                }

                // If ALL API calls returned null, the backend server is likely offline
                if (!txData && !goalsData && !loansData) {
                    setError("Backend Unreachable: Is the API server running?");
                }
            }
        } catch (e) {
            console.error("Critical Data Fetch Error:", e);
            setError("Sync Error: Please check your internet or backend connection.");
        } finally {
            setLoading(false);
        }
    }, [user, realmType, entityId]);

    const generateReport = useCallback(() => {
        if (realmType === 'admin') {
            if (premiums.length === 0) return;
            const now = new Date();
            const startDate = new Date();
            if (period === 'weekly') startDate.setDate(now.getDate() - 7);
            else if (period === 'yearly') startDate.setFullYear(now.getFullYear() - 1);
            else startDate.setMonth(now.getMonth() - 1);

            const revenueData = {};
            let periodInflow = 0;

            premiums.forEach(p => {
                const ts = p.granted_at?.seconds ? new Date(p.granted_at.seconds * 1000) : null;
                if (ts && ts >= startDate && ts <= now) {
                    const key = ts.toLocaleDateString();
                    revenueData[key] = (revenueData[key] || 0) + (p.amount || 0);
                    periodInflow += (p.amount || 0);
                }
            });

            const labels = Object.keys(revenueData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            setReport({
                chartData: {
                    labels,
                    datasets: [{
                        label: 'Admin Funds (₱)',
                        data: labels.map(l => revenueData[l]),
                        backgroundColor: 'rgba(147, 51, 234, 0.5)',
                        borderColor: 'rgba(147, 51, 234, 1)',
                        borderWidth: 2, fill: true, tension: 0.4
                    }]
                },
                totalInflow: periodInflow,
                transactionCount: premiums.length
            });
        } else {
            if (transactions.length === 0) {
                setReport(null);
                return;
            }
            const chartGroups = {};
            let inflow = 0, outflow = 0;
            transactions.forEach(tx => {
                const date = new Date(tx.created_at).toLocaleDateString();
                if (!chartGroups[date]) chartGroups[date] = { income: 0, expense: 0 };
                if (tx.type === 'income') { chartGroups[date].income += tx.amount; inflow += tx.amount; }
                else { chartGroups[date].expense += tx.amount; outflow += tx.amount; }
            });
            const labels = Object.keys(chartGroups).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            setReport({
                chartData: {
                    labels,
                    datasets: [
                        { label: 'Inflow (₱)', data: labels.map(l => chartGroups[l].income), backgroundColor: 'rgba(75, 192, 192, 0.5)', borderColor: 'rgb(75, 192, 192)', borderWidth: 1 },
                        { label: 'Outflow (₱)', data: labels.map(l => chartGroups[l].expense), backgroundColor: 'rgba(255, 99, 132, 0.5)', borderColor: 'rgb(255, 99, 132)', borderWidth: 1 }
                    ]
                },
                totalInflow: inflow, totalOutflow: outflow, netPosition: inflow - outflow,
                transactionCount: transactions.length
            });
        }
    }, [realmType, premiums, transactions, period]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { generateReport(); }, [generateReport, period]);

    return { 
        loading, error, period, setPeriod, refresh: fetchData,
        transactions, summaryData, report,
        users, premiums, pendingCount, totalFunds,
        activeGoalsCount, outstandingLending
    };
}