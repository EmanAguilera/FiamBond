import { useContext, useState, useEffect, useCallback } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { sendEmailVerification, applyActionCode, signOut } from 'firebase/auth'; 
import { auth } from '../../config/firebase-config';
import { useNavigate, useLocation } from 'react-router-dom';

const COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
    const { user, handleLogout } = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const userUid = user?.uid;
    const storageKey = `verificationSent_${userUid}`;

    // --- COOLDOWN TIMER EFFECT ---
    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    // --- FUNCTION TO SEND EMAIL ---
    const handleSendVerification = useCallback(async (isAutoSend = false) => {
        const currentUser = auth.currentUser; 
        if (!currentUser || isResending) return; 

        const lastSent = parseInt(localStorage.getItem(storageKey), 10);
        const now = Date.now();
        const cooldownMs = COOLDOWN_SECONDS * 1000;
        
        // CRITICAL: Check localStorage time to prevent Firebase rate limit errors
        if (lastSent && now - lastSent < cooldownMs) {
            const remaining = Math.ceil((cooldownMs - (now - lastSent)) / 1000);
            setCooldown(remaining);
            if (!isAutoSend) {
                setError(`Please wait ${remaining} seconds before requesting again.`);
            }
            return;
        }

        setIsResending(true);
        setMessage('');
        setError('');

        try {
            // FIX: Use auth.currentUser for Firebase-specific calls to prevent "getIdToken is not a function"
            await sendEmailVerification(currentUser, { url: `${window.location.origin}/verify-email` }); 
            
            // On successful send, update localStorage and start local countdown
            localStorage.setItem(storageKey, now.toString());
            setCooldown(COOLDOWN_SECONDS);
            setMessage('Verification email sent! Check your email.');

        } catch (err) { // Fix for SyntaxError was removing ': any'
            console.error("Resend Verification Error:", err);
            if (err.code === 'auth/too-many-requests') {
                setError('You have requested this too many times. Please wait a moment before trying again.');
                setCooldown(COOLDOWN_SECONDS * 2); 
            } else {
                setError('Failed to resend verification email. Please try again later.');
            }
        } finally {
            setIsResending(false);
        }
    }, [isResending, storageKey]);

    // --- AUTO-SEND/COOLDOWN CHECK ON MOUNT/USER STATE CHANGE ---
    useEffect(() => {
        if (!user || user.emailVerified) return;

        const lastSent = parseInt(localStorage.getItem(storageKey), 10);
        const now = Date.now();
        const cooldownMs = COOLDOWN_SECONDS * 1000;
        const timeElapsed = now - lastSent;

        if (user.emailVerified) {
            navigate('/');
        } else if (!lastSent || timeElapsed >= cooldownMs) {
            handleSendVerification(true); 
        } else {
            const remaining = Math.ceil((cooldownMs - timeElapsed) / 1000);
            setCooldown(remaining);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userUid, navigate]); 

    // --- HANDLE EMAIL VERIFICATION FROM LINK (PREVIOUS FIX) ---
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const actionCode = urlParams.get('oobCode');

        if (mode === 'verifyEmail' && actionCode) {
            applyActionCode(auth, actionCode)
                .then(async () => {
                    if (auth.currentUser) {
                        await auth.currentUser.reload();
                    }
                    setMessage('Email verified successfully! Redirecting to dashboard...');
                    setTimeout(() => navigate('/'), 1500);
                })
                .catch((error) => {
                    console.error('Error applying action code:', error);
                    setError('Failed to verify email. The link may be invalid or expired.');
                });
        }
    }, [navigate]);

    // --- POLLING TO CATCH VERIFICATION (Fallback/Keep) ---
    useEffect(() => {
        const interval = setInterval(async () => {
            if (auth.currentUser) {
                await auth.currentUser.reload();
                if (auth.currentUser.emailVerified) {
                    clearInterval(interval);
                    navigate('/');
                }
            }
        }, 5000); 

        return () => clearInterval(interval);
    }, [navigate]);

    // Handle registration success message
    useEffect(() => {
        const registrationMessage = location.state?.message;
        if (registrationMessage) {
            setMessage(registrationMessage);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const isButtonDisabled = isResending || cooldown > 0;

    if (!user) {
        return <main className="flex items-center justify-center h-screen">Redirecting to Login...</main>;
    }

    // --- Render ---
    return (
        <main className="login-wrapper h-screen w-screen overflow-hidden flex items-center justify-center bg-gray-50">
            <div className="login-card w-full max-w-md text-center" style={{ maxWidth: '450px' }}>
                <h1 className="title">Verify Your Email Address</h1>
                <p className="text-gray-600 mb-6">
                    A verification link has been sent to your email address:
                    <br />
                    <strong className="text-gray-800">{user.email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    Please click the link in that email to continue. This page will automatically redirect you once you are verified.
                </p>

                {message && <p className="success mb-4">{message}</p>}
                {error && <p className="error mb-4">{error}</p>}

                <div className="space-y-4">
                    <button 
                        onClick={() => handleSendVerification()} 
                        className="primary-btn w-full"
                        disabled={isButtonDisabled}
                    >
                        {isResending ? 'Sending...' : (cooldown > 0 ? `Resend again in ${cooldown}s` : 'Resend Verification Email')}
                    </button>
                    <button 
                        onClick={() => signOut(auth).then(handleLogout).then(() => navigate('/login'))}
                        className="secondary-btn w-full"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </main>
    );
}