import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    SafeAreaView,
    ViewStyle // Added for GoogleIconProps
} from "react-native";
// Hooks for React Navigation (replace react-router-dom)
import { useNavigation, useRoute } from "@react-navigation/native";
// Toast for notifications (replace react-hot-toast)
import Toast from 'react-native-toast-message';
// Icons (replace general HTML button with an icon)
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Import navigation types
import { LoginScreenProps } from "../../types/navigation";

// Assuming the Firebase config and functions are imported and work in RN
import { auth, db, googleProvider } from "../../config/firebase-config";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

interface LoginFormData {
  email: string;
  password: string;
}

// Define props for GoogleIcon
interface GoogleIconProps {
  style?: ViewStyle;
}

// Icon component for the Google Button
const GoogleIcon = (props: GoogleIconProps) => (
    <FontAwesome name="google" size={18} color="black" {...props} />
);

export default function LoginNative({ navigation, route }: LoginScreenProps) {
  
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // This is RN's equivalent of location.state?.message
  const registrationMessage = route.params?.message;

  useEffect(() => {
    if (registrationMessage) {
      // Display the registration success message as a toast
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: registrationMessage,
        position: 'top',
      });
      
      // Clear the message from params to prevent it from re-appearing
      // Replace: navigate(location.pathname, { replace: true, state: {} });
      // In RN, you set the params to undefined on the current route
      navigation.setParams({ message: undefined });
    }
  }, [registrationMessage, navigation]);

  const handleInputChange = useCallback((id: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    // Clear the main form error whenever the user types
    setGeneralError(null);
  }, []);

  async function handleLoginSubmit() {
    setIsLoading(true);
    setGeneralError(null);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // Replace: navigate("/");
      navigation.navigate("HomeStack"); // Navigate to the main protected stack
    } catch (error: any) {
      // For the main login error, an inline message is often better UX
      setGeneralError("Incorrect email or password. Please try again.");
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setGeneralError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if a user document already exists in Firestore.
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // If the user document does NOT exist, create it.
      if (!userDocSnap.exists()) {
        const nameParts = user.displayName?.split(" ") || ["", ""];
        await setDoc(userDocRef, {
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(" ") || "",
          full_name: user.displayName,
          email: user.email,
          created_at: serverTimestamp(),
        });
      }
      
      // Replace: navigate("/"); 
      navigation.navigate("HomeStack"); // Navigate to the main protected stack
    } catch (error) {
      // Use a toast for less critical errors like this
      Toast.show({
        type: 'error',
        text1: 'Sign-in Failed',
        text2: "Failed to sign in with Google. Please try again.",
        position: 'top',
      });
      console.error('Google sign-in error:', error);
    } finally {
        setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    // First, validate that the email field is not empty
    if (!formData.email) {
      setGeneralError("Please enter your email address to reset your password.");
      return;
    }
    setGeneralError(null);
    
    // Show a loading toast while the email is being sent
    Toast.show({
        type: 'info',
        text1: 'Processing',
        text2: 'Sending password reset email...',
        position: 'top',
        autoHide: false,
    });
    
    try {
      await sendPasswordResetEmail(auth, formData.email);
      
      // On success, update the toast to a success message
      Toast.hide();
      Toast.show({
          type: 'success',
          text1: 'Success',
          text2: "Password reset email sent! Please check your inbox.",
          position: 'top',
      });
    } catch (error: any) {
        Toast.hide();
        // On failure, update the toast to an error message
        if (error.code === 'auth/user-not-found') {
            setGeneralError("No account found with this email address.");
        } else {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: "Failed to send password reset email. Please try again.",
                position: 'top',
            });
        }
        console.error('Password reset error:', error);
    }
  };

  // Convert FormEvent<HTMLFormElement> to a generic void function for RN
  const handleSubmit = () => {
    if (!isLoading) {
        handleLoginSubmit();
    }
  };


  return (
    // SafeAreaView handles notches/status bar, ScrollView handles keyboard pushing content
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.loginWrapper}>
        <View style={styles.loginCard}>
          <Text style={styles.title}>Sign in to your account</Text>
          
          <View style={styles.socialLoginContainer}>
            <TouchableOpacity 
                onPress={handleGoogleSignIn} 
                style={styles.secondaryBtn}
                disabled={isLoading}
            > 
              <GoogleIcon style={styles.googleIcon} />
              <Text style={styles.secondaryBtnText}>Sign In With Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine}></View>
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine}></View>
          </View>

          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email address</Text>
              <TextInput
                style={styles.formInput}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChangeText={(text) => handleInputChange("email", text)}
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Password</Text>
              <TextInput
                style={styles.formInput}
                secureTextEntry
                placeholder="••••••••"
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                editable={!isLoading}
              />
              <View style={styles.forgotPasswordContainer}>
                  <TouchableOpacity 
                      onPress={handlePasswordReset}
                      style={styles.forgotPasswordButton}
                      disabled={isLoading}
                  >
                      <Text style={styles.textLink}>Forgot Password?</Text>
                  </TouchableOpacity>
              </View>
            </View>
            
            {/* Inline error for primary form actions */}
            {generalError && <Text style={styles.errorText}>{generalError}</Text>}

            <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={handleSubmit}
                disabled={isLoading}
            > 
                <Text style={styles.primaryBtnText}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.registerPrompt}>
            Don't have an account? {' '}
            <Text 
                style={styles.textLink} 
                onPress={() => navigation.navigate("Register")} // RN Navigation
            >
                Register here
            </Text>
          </Text>
        </View>
      </ScrollView>
      {/* Toast component must be rendered for the Toast API to work */}
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
        maxWidth: 448, // max-w-md (approx 28rem)
        padding: 40, // p-8 sm:p-10
        backgroundColor: 'white',
        borderRadius: 16, // rounded-2xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8, // shadow-xl
    },
    title: {
        marginBottom: 32, // mb-8
        fontSize: 28, // text-3xl
        fontWeight: '900', // font-extrabold
        textAlign: 'center',
        color: '#1f2937', // text-gray-900
    },

    // --- Social Login ---
    socialLoginContainer: {
        marginBottom: 16,
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
        marginLeft: 10,
    },
    googleIcon: {
        color: '#4f46e5',
        marginRight: 8,
    },

    // --- Divider ---
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20, // py-5
    },
    dividerLine: {
        flexGrow: 1,
        height: 1,
        backgroundColor: '#e5e7eb', // border-t border-gray-200
    },
    dividerText: {
        marginHorizontal: 16, // mx-4
        fontSize: 12, // text-sm
        color: '#9ca3af', // text-gray-400
    },

    // --- Form ---
    formContainer: {
        marginBottom: 24,
    },
    formGroup: {
        marginBottom: 24, // mb-6
        position: 'relative',
    },
    formLabel: {
        marginBottom: 8, // mb-2
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
        color: '#374151', // text-gray-700
    },
    formInput: {
        height: 48, // Approx p-3.5 or py-3
        width: '100%', // w-full
        paddingHorizontal: 16, // px-4
        paddingVertical: 10, // py-3
        backgroundColor: '#f9fafb', // bg-gray-50
        borderRadius: 8, // rounded-lg
        borderWidth: 1,
        borderColor: '#d1d5db', // border-gray-300
        color: '#1f2937', // text-slate-900
        fontSize: 16, // sm:text-sm
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginTop: 8, // mt-2
    },
    forgotPasswordButton: {
        // Just acts as a wrapper for onPress
    },
    textLink: {
        fontSize: 14, // text-sm
        fontWeight: '600', // font-semibold
        color: '#4f46e5', // text-indigo-600
    },
    
    errorText: {
        marginTop: 8, // mt-2
        fontSize: 14, // text-sm
        color: '#dc2626', // text-red-600
        textAlign: 'center', // Added for better visibility of inline error
        marginBottom: 16,
    },

    // --- Primary Button ---
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
        // Disabled style (for isLoading)
        opacity: 1.0,
    },
    primaryBtnText: {
        fontSize: 16, // text-base
        fontWeight: '600', // font-semibold
        color: 'white',
    },
    
    // --- Register Prompt ---
    registerPrompt: {
        textAlign: 'center',
        fontSize: 14, // text-sm
        color: '#4b5563', // text-gray-600
        marginTop: 24, // mt-6
    },
});