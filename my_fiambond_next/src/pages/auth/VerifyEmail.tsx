"use client";

import { useContext, useState, useEffect, useCallback, Suspense } from 'react';
import { AppContext } from '@/src/context/AppContext';
import { sendEmailVerification, applyActionCode, signOut, Auth } from 'firebase/auth';
import { auth } from '@/src/config/firebase-config';
import { useRouter, useSearchParams } from 'next/navigation';

// ⭐️ INTEGRATION: Using your specific UnifiedLoadingWidget
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

const COOLDOWN_SECONDS = 60;

// 1. THE CONTENT COMPONENT: Logic and UI
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

    useEffect(() => {
        let timer: any;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

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
            if (!isAutoSend) setError(`Please wait ${remaining} seconds.`);
            return;
        }

        setIsResending(true);
        setMessage('');
        setError('');

        try {
            await sendEmailVerification(currentUser, { url: `${window.location.origin}/verify-email` }); 
            localStorage.setItem(storageKey, now.toString());
            setCooldown(COOLDOWN_SECONDS);
            setMessage('Verification email sent!');
        } catch (err: any) {
            setError(err.code === 'auth/too-many-requests' ? 'Too many requests. Wait a bit.' : 'Failed to send.');
        } finally {
            setIsResending(false);
        }
    }, [isResending, storageKey]);

    useEffect(() => {
        if (!user) return;
        if (user.emailVerified) router.push('/');

        const lastSent = parseInt(localStorage.getItem(storageKey) || "0", 10);
        const timeElapsed = Date.now() - lastSent;

        if (!lastSent || timeElapsed >= (COOLDOWN_SECONDS * 1000)) {
            handleSendVerification(true); 
        } else {
            setCooldown(Math.ceil(((COOLDOWN_SECONDS * 1000) - timeElapsed) / 1000));
        }
    }, [user, userUid, router, handleSendVerification, storageKey]); 

    useEffect(() => {
        const mode = searchParams?.get('mode');
        const actionCode = searchParams?.get('oobCode');
        
        const firebaseAuth = auth as Auth | null;
        if (!firebaseAuth) {
            setError("Authentication service is unavailable.");
            return;
        }

        if (mode === 'verifyEmail' && actionCode) {
            applyActionCode(firebaseAuth, actionCode)
                .then(async () => {
                    if (firebaseAuth.currentUser) await firebaseAuth.currentUser.reload();
                    setMessage('Verified successfully! Redirecting...');
                    setTimeout(() => router.push('/'), 1500);
                })
                .catch(() => setError('Invalid or expired link.'));
        }
    }, [searchParams, router]);

    useEffect(() => {
        const firebaseAuth = auth as Auth | null;
        if (!firebaseAuth) return;
        
        const interval = setInterval(async () => {
            if (firebaseAuth.currentUser) {
                await firebaseAuth.currentUser.reload();
                if (firebaseAuth.currentUser.emailVerified) {
                    clearInterval(interval);
                    router.push('/');
                }
            }
        }, 5000); 
        return () => clearInterval(interval);
    }, [router]);

    if (!user) return <UnifiedLoadingWidget type="fullscreen" message="Authenticating..." />;
    
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-gray-100">
                <div className="mb-6 flex justify-center">
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold mb-2 text-gray-800">Verify Your Email</h1>
                <p className="text-gray-500 mb-6 text-sm">We've sent a link to:<br/><span className="font-bold text-gray-700">{user.email}</span></p>
                
                {message && <p className="text-emerald-600 text-sm font-bold mb-4 bg-emerald-50 py-2 rounded-lg">{message}</p>}
                {error && <p className="text-rose-600 text-sm font-bold mb-4 bg-rose-50 py-2 rounded-lg">{error}</p>}
                
                <div className="space-y-3">
                    <button 
                        onClick={() => handleSendVerification()} 
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100" 
                        disabled={isResending || cooldown > 0 || !auth}
                    >
                        {isResending ? (
                            <UnifiedLoadingWidget type="inline" message="Sending..." />
                        ) : (
                            cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'
                        )}
                    </button>
                    
                    <button 
                        onClick={() => auth && signOut(auth).then(handleLogout).then(() => router.push('/login'))} 
                        className="w-full text-gray-400 text-sm font-bold py-2 hover:text-gray-600 transition-all uppercase tracking-widest" 
                        disabled={!auth}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </main>
    );
}

// 2. THE EXPORTED PAGE: Wraps everything in Suspense
export default function VerifyEmail() {
    return (
        <Suspense fallback={<UnifiedLoadingWidget type="fullscreen" message="Checking Status..." />}>
            <VerifyEmailContent />
        </Suspense>
    );
}