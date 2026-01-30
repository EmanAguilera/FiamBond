"use client";

import { useContext, useState, useEffect, useCallback } from 'react';
import { AppContext } from '@/src/Context/AppContext';
import { sendEmailVerification, applyActionCode, signOut, Auth } from 'firebase/auth'; // Import Auth type for clarity
import { auth, db, googleProvider } from '@/src/config/firebase-config';
import { useRouter, useSearchParams } from 'next/navigation';

const COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
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
        // ⭐️ FIX 1: Check and assign auth to a non-null variable (optional, but clean)
        const firebaseAuth = auth as Auth | null;
        if (!firebaseAuth) {
            setError("Authentication service is unavailable.");
            return;
        }

        const currentUser = firebaseAuth.currentUser; 
        if (!currentUser || isResending) return; 
        
        // ... (rest of cooldown logic is fine)
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
        
        // ⭐️ FIX 2: Check for auth immediately and assert its type for the promise chain
        const firebaseAuth = auth as Auth | null;
        if (!firebaseAuth) {
            setError("Authentication service is unavailable.");
            return;
        }

        if (mode === 'verifyEmail' && actionCode) {
            applyActionCode(firebaseAuth, actionCode)
                .then(async () => {
                    // Check currentUser before using
                    if (firebaseAuth.currentUser) await firebaseAuth.currentUser.reload();
                    setMessage('Verified successfully! Redirecting...');
                    setTimeout(() => router.push('/'), 1500);
                })
                .catch(() => setError('Invalid or expired link.'));
        }
    }, [searchParams, router]);

    // Polling
    useEffect(() => {
        // ⭐️ FINAL FIX 3: Check for auth before setting the interval and assert its type
        const firebaseAuth = auth as Auth | null;
        if (!firebaseAuth) return;
        
        const interval = setInterval(async () => {
            // firebaseAuth is guaranteed not to be null inside this function scope
            if (firebaseAuth.currentUser) {
                await firebaseAuth.currentUser.reload();
                if (firebaseAuth.currentUser.emailVerified) {
                    clearInterval(interval);
                    router.push('/');
                }
            }
        }, 5000); 
        return () => clearInterval(interval);
    }, [router]); // Removed auth from dependency array since it's used only inside the guard

    if (!user) return <div className="h-screen flex items-center justify-center">Redirecting...</div>;
    
    // ⭐️ FIX 4: Ensure all JSX checks and handlers use the non-null auth value (original 'auth' is fine here since the build won't proceed if it's null)
    
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
                <p className="text-gray-600 mb-6">Sent to: <br/><strong>{user.email}</strong></p>
                {message && <p className="text-green-600 font-bold mb-4">{message}</p>}
                {error && <p className="text-red-600 font-bold mb-4">{error}</p>}
                <div className="space-y-4">
                    <button onClick={() => handleSendVerification()} className="primary-btn w-full bg-indigo-600 text-white py-3 rounded-lg font-bold" disabled={isResending || cooldown > 0 || !auth}>
                        {isResending ? 'Sending...' : (cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email')}
                    </button>
                    {/* FIX: Check for auth before calling signOut */}
                    <button onClick={() => auth && signOut(auth).then(handleLogout).then(() => router.push('/login'))} className="w-full text-gray-500 font-bold py-2" disabled={!auth}>Logout</button>
                </div>
            </div>
        </main>
    );
}