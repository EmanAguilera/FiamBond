"use client";

import { useContext, useState, useEffect, useCallback, Suspense } from 'react';
import { AppContext } from '@/src/context/AppContext';
import { sendEmailVerification, applyActionCode, signOut, Auth } from 'firebase/auth';
import { auth } from '@/src/config/firebase-config';
import { useRouter, useSearchParams } from 'next/navigation';

// Custom components
import UnifiedLoadingWidget from "@/src/components/ui/UnifiedLoadingWidget";

const COOLDOWN_SECONDS = 60;

function VerifyEmailContent() {
    const { user, handleLogout } = useContext(AppContext);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const userUid = user?.uid;
    const storageKey = `verificationSent_${userUid}`;

    // --- LOGIC: Cooldown Timer ---
    useEffect(() => {
        let timer: any;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    // --- LOGIC: Resend Verification ---
    const handleSendVerification = useCallback(async (isAutoSend = false) => {
        const firebaseAuth = auth as Auth | null;
        if (!firebaseAuth) {
            setError("Authentication service is unavailable.");
            return;
        }

        const currentUser = firebaseAuth.currentUser; 
        if (!currentUser || isResending) return; 
        
        const lastSent = parseInt(localStorage.getItem(storageKey) || "0", 10);
        const now = Date.now();
        const cooldownMs = COOLDOWN_SECONDS * 1000;
        
        if (lastSent && now - lastSent < cooldownMs) {
            const remaining = Math.ceil((cooldownMs - (now - lastSent)) / 1000);
            setCooldown(remaining);
            if (!isAutoSend) setError(`Please wait ${remaining} seconds before resending.`);
            return;
        }

        setIsResending(true);
        setMessage('');
        setError('');

        try {
            await sendEmailVerification(currentUser, { url: `${window.location.origin}/verify-email` }); 
            localStorage.setItem(storageKey, now.toString());
            setCooldown(COOLDOWN_SECONDS);
            setMessage('A new verification link has been sent to your email.');
        } catch (err: any) {
            setError(err.code === 'auth/too-many-requests' ? 'Too many requests. Please wait a bit.' : 'Failed to send verification email.');
        } finally {
            setIsResending(false);
        }
    }, [isResending, storageKey]);

    // --- LOGIC: Handle URL Codes (mode=verifyEmail) ---
    useEffect(() => {
        const mode = searchParams?.get('mode');
        const actionCode = searchParams?.get('oobCode');
        
        const firebaseAuth = auth as Auth | null;
        if (!firebaseAuth) return;

        if (mode === 'verifyEmail' && actionCode) {
            applyActionCode(firebaseAuth, actionCode)
                .then(async () => {
                    if (firebaseAuth.currentUser) await firebaseAuth.currentUser.reload();
                    setMessage('Your email has been verified! Redirecting to Realm...');
                    setTimeout(() => router.push('/realm'), 2000);
                })
                .catch(() => setError('The verification link is invalid or has expired.'));
        }
    }, [searchParams, router]);

    // --- LOGIC: Auto-check verification status ---
    useEffect(() => {
        const firebaseAuth = auth as Auth | null;
        if (!firebaseAuth) return;
        
        const interval = setInterval(async () => {
            if (firebaseAuth.currentUser) {
                await firebaseAuth.currentUser.reload();
                if (firebaseAuth.currentUser.emailVerified) {
                    clearInterval(interval);
                    router.push('/realm');
                }
            }
        }, 5000); 
        return () => clearInterval(interval);
    }, [router]);

    // --- LOGIC: Initial Redirect if already verified ---
    useEffect(() => {
        if (user?.emailVerified) {
            router.push('/realm');
        }
    }, [user, router]);

    if (!user) return <UnifiedLoadingWidget type="fullscreen" message="Authenticating..." />;
    
    return (
        <main className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100 text-center">
                
                {/* Visual Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 shadow-sm border border-indigo-100">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
                
                {/* Header */}
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">Verify Your Email</h1>
                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                    We've sent a verification link to:<br/>
                    <span className="text-indigo-600 font-bold block mt-1">{user.email}</span>
                </p>
                
                {/* Notification Blocks */}
                {message && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold p-4 rounded-xl mb-6 animate-in fade-in zoom-in-95">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-4 rounded-xl mb-6 animate-in fade-in zoom-in-95">
                        {error}
                    </div>
                )}
                
                {/* Action Buttons */}
                <div className="space-y-4">
                    <button 
                        onClick={() => handleSendVerification()} 
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center" 
                        disabled={isResending || cooldown > 0 || !auth}
                    >
                        {isResending ? (
                            <UnifiedLoadingWidget type="inline" message="Sending..." variant="white" />
                        ) : (
                            cooldown > 0 ? `Resend Available in ${cooldown}s` : 'Resend Verification Email'
                        )}
                    </button>
                    
                    <button 
                        onClick={() => auth && signOut(auth).then(handleLogout).then(() => router.push('/login'))} 
                        className="w-full text-gray-400 text-xs font-bold py-2 hover:text-gray-600 transition-all uppercase tracking-[0.2em]" 
                        disabled={!auth}
                    >
                        Sign Out & Try Another Email
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-medium italic">
                        Once you verify the link in your email, this page will update automatically.
                    </p>
                </div>
            </div>
        </main>
    );
}

// Full page wrapper with Suspense
export default function VerifyEmail() {
    return (
        <Suspense fallback={<UnifiedLoadingWidget type="fullscreen" message="Checking Status..." />}>
            <VerifyEmailContent />
        </Suspense>
    );
}