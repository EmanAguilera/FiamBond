import React, { useContext, useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    SafeAreaView,
    ScrollView
} from 'react-native';
// Hooks for React Navigation (replace react-router-dom)
import { useNavigation } from '@react-navigation/native';
// Toast for notifications (for the resend success/error messages)
import Toast from 'react-native-toast-message';

import { AppContext } from '../../Context/AppContext.jsx';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../config/firebase-config';

export default function VerifyEmailNative() {
    const { user, handleLogout } = useContext(AppContext);
    const navigation = useNavigation(); // RN equivalent of useNavigate()
    
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // --- 1. Email Verification Check (Web: useEffect for auto-reload/redirect) ---
    useEffect(() => {
        const interval = setInterval(async () => {
            if (auth.currentUser) {
                // Must manually check for updates to the user object (emailVerified status)
                await auth.currentUser.reload();
                
                if (auth.currentUser.emailVerified) {
                    clearInterval(interval);
                    // Navigate to home/dashboard (e.g., the main protected stack)
                    // Replaces: navigate('/');
                    navigation.navigate('HomeStack'); 
                }
            }
        }, 3000); // Check every 3 seconds

        return () => clearInterval(interval);
    }, [navigation]);

    // --- 2. Cooldown Timer (Web: useEffect for button cooldown) ---
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    // --- 3. Resend Verification Logic ---
    const handleResendVerification = async () => {
        if (!auth.currentUser) return;
        setIsResending(true);
        setMessage('');
        setError('');
        
        Toast.hide(); // Hide any previous toast
        
        try {
            await sendEmailVerification(auth.currentUser);
            
            // Success Message (using local state and Toast for immediate feedback)
            setMessage('A new verification email has been sent.');
            Toast.show({
                type: 'success',
                text1: 'Verification Sent',
                text2: 'A new verification email has been sent. Check your inbox.',
                position: 'top',
            });
            setCooldown(60); // Start the 60-second cooldown
            
        } catch (err) { // FIX: Removed type annotation ': any'
            console.error("Resend Verification Error:", err);
            let errorMessage = 'Failed to resend verification email. Please try again later.';
            
            if (err.code === 'auth/too-many-requests') {
                errorMessage = 'You have requested this too many times. Please wait a moment before trying again.';
            } 
            
            setError(errorMessage);
            Toast.show({
                type: 'error',
                text1: 'Resend Failed',
                text2: errorMessage,
                position: 'top',
            });
            
        } finally {
            setIsResending(false);
        }
    };

    const isButtonDisabled = isResending || cooldown > 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.loginWrapper}>
                <View style={styles.loginCard}>
                    <Text style={styles.title}>Verify Your Email Address</Text>
                    
                    <Text style={styles.textBase}>
                        A verification link has been sent to your email address:
                        {'\n'}
                        <Text style={styles.emailText}>{user?.email}</Text>
                    </Text>
                    
                    <Text style={styles.redirectPrompt}>
                        Please click the link in that email to continue. This page will automatically redirect you once you are verified.
                    </Text>

                    {/* Local message/error display (optional, can be fully replaced by Toast) */}
                    {message && <Text style={styles.successText}>{message}</Text>}
                    {error && <Text style={styles.errorText}>{error}</Text>}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            onPress={handleResendVerification}
                            style={[styles.primaryBtn, isButtonDisabled && styles.disabledBtn]}
                            disabled={isButtonDisabled}
                        >
                            <Text style={styles.primaryBtnText}>
                                {isResending ? 'Sending...' : (cooldown > 0 ? `Resend again in ${cooldown}s` : 'Resend Verification Email')}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={handleLogout} // Assumed to be a function that signs out and navigates away
                            style={styles.secondaryBtn}
                        >
                            <Text style={styles.secondaryBtnText}>
                                Logout
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <Toast />
        </SafeAreaView>
    );
}

// --- React Native StyleSheet Conversion ---

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb', // bg-gray-50
    },
    loginWrapper: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9fafb', // bg-gray-50
    },
    loginCard: {
        width: '100%',
        maxWidth: 450, // max-w-md / custom width
        padding: 40, // p-8 sm:p-10
        backgroundColor: 'white',
        borderRadius: 16, // rounded-2xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8, // shadow-xl
        textAlign: 'center', // text-center
    },
    title: {
        marginBottom: 32, // mb-8
        fontSize: 28, // text-3xl
        fontWeight: '900', // font-extrabold
        textAlign: 'center',
        color: '#1f2937', // text-gray-900
    },
    textBase: {
        color: '#4b5563', // text-gray-600
        fontSize: 16,
        marginBottom: 24, // mb-6
        textAlign: 'center',
    },
    emailText: {
        fontWeight: '700', // strong
        color: '#1f2937', // text-gray-800
        fontSize: 16,
    },
    redirectPrompt: {
        fontSize: 14, // text-sm
        color: '#6b7280', // text-gray-500
        marginBottom: 24, // mb-6
        textAlign: 'center',
    },
    
    // Message/Error Styles (from general styles/Tailwind classes)
    successText: {
        fontSize: 14,
        color: '#10b981', // green-600
        backgroundColor: '#ecfdf5', // green-50
        padding: 12,
        borderRadius: 8,
        marginBottom: 16, // mb-4
        textAlign: 'center',
    },
    errorText: {
        fontSize: 14,
        color: '#dc2626', // red-600 (className="error")
        backgroundColor: '#fef2f2', // red-50
        padding: 12,
        borderRadius: 8,
        marginBottom: 16, // mb-4
        textAlign: 'center',
    },

    // Buttons
    buttonContainer: {
        gap: 16, // space-y-4
    },
    primaryBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%', // w-full
        paddingHorizontal: 24, // px-6
        paddingVertical: 12, // py-3
        backgroundColor: '#4f46e5', // bg-indigo-600
        borderRadius: 8, // rounded-lg
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // shadow-md
    },
    primaryBtnText: {
        fontSize: 16, // text-base
        fontWeight: '600', // font-semibold
        color: 'white',
    },
    disabledBtn: {
        backgroundColor: '#9ca3af', // gray-400 equivalent for disabled state
    },
    secondaryBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%', // w-full
        paddingHorizontal: 24, // px-6
        paddingVertical: 12, // py-3
        backgroundColor: '#eef2ff', // bg-indigo-100
        borderRadius: 8, // rounded-lg
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1, // shadow-md
    },
    secondaryBtnText: {
        fontSize: 16, // text-base
        fontWeight: '600', // font-semibold
        color: '#4f46e5', // text-indigo-700
    },
});