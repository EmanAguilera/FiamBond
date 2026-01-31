"use client";

import { useContext, useState, useEffect, useCallback, Suspense } from 'react';
import { AppContext } from '@/src/Context/AppContext';
import { sendEmailVerification, applyActionCode, signOut, Auth } from 'firebase/auth';
import { auth } from '@/src/config/firebase-config';
import { useRouter, useSearchParams } from 'next/navigation';

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
        const mode = searchParams.get('mode');
        const actionCode = searchParams.get('oobCode');
        
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

    if (!user) return <div className="h-screen flex items-center justify-center">Redirecting...</div>;
    
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
                <p className="text-gray-600 mb-6">Sent to: <br/><strong>{user.email}</strong></p>
                {message && <p className="text-green-600 font-bold mb-4">{message}</p>}
                {error && <p className="text-red-600 font-bold mb-4">{error}</p>}
                <div className="space-y-4">
                    <button 
                        onClick={() => handleSendVerification()} 
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all disabled:opacity-50" 
                        disabled={isResending || cooldown > 0 || !auth}
                    >
                        {isResending ? 'Sending...' : (cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email')}
                    </button>
                    <button 
                        onClick={() => auth && signOut(auth).then(handleLogout).then(() => router.push('/login'))} 
                        className="w-full text-gray-500 font-bold py-2 hover:text-gray-700 transition-all" 
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
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Checking verification status...</p>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}