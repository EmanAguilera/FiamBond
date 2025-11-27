import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../config/firebase-config';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
    const { user, handleLogout } = useContext(AppContext);
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // All of your existing logic for this component remains the same.
    useEffect(() => {
        const interval = setInterval(async () => {
            if (auth.currentUser) {
                await auth.currentUser.reload();
                if (auth.currentUser.emailVerified) {
                    clearInterval(interval);
                    navigate('/');
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [navigate]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResendVerification = async () => {
        if (!auth.currentUser) return;
        setIsResending(true);
        setMessage('');
        setError('');
        try {
            await sendEmailVerification(auth.currentUser);
            setMessage('A new verification email has been sent.');
            setCooldown(60);
        } catch (err) {
            console.error("Resend Verification Error:", err);
            if (err.code === 'auth/too-many-requests') {
                setError('You have requested this too many times. Please wait a moment before trying again.');
            } else {
                setError('Failed to resend verification email. Please try again later.');
            }
        } finally {
            setIsResending(false);
        }
    };

    const isButtonDisabled = isResending || cooldown > 0;

    // This is the layout wrapper that makes the page look like your Login/Register pages.
    return (
        <main className="login-wrapper h-screen w-screen overflow-hidden flex items-center justify-center bg-gray-50">
            <div className="login-card w-full max-w-md text-center" style={{ maxWidth: '450px' }}>
                <h1 className="title">Verify Your Email Address</h1>
                <p className="text-gray-600 mb-6">
                    A verification link has been sent to your email address:
                    <br />
                    <strong className="text-gray-800">{user?.email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    Please click the link in that email to continue. This page will automatically redirect you once you are verified.
                </p>

                {message && <p className="success mb-4">{message}</p>}
                {error && <p className="error mb-4">{error}</p>}

                <div className="space-y-4">
                    <button 
                        onClick={handleResendVerification}
                        className="primary-btn w-full"
                        disabled={isButtonDisabled}
                    >
                        {isResending ? 'Sending...' : (cooldown > 0 ? `Resend again in ${cooldown}s` : 'Resend Verification Email')}
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="secondary-btn w-full"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </main>
    );
}