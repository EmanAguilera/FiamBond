import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    ViewStyle
} from "react-native";
// Icons (for the Google button)
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Assuming the Firebase config and functions are imported and work in RN
import { auth, db, googleProvider } from "../../config/firebase-config";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { RegisterScreenProps } from "../../types/navigation";

interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface GoogleIconProps {
  style?: ViewStyle;
}

// Icon component for the Google Button
const GoogleIcon = (props: GoogleIconProps) => (
    <FontAwesome name="google" size={18} color="black" {...props} />
);

export default function RegisterNative({ navigation }: RegisterScreenProps) {
  
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "", last_name: "", email: "", password: "", password_confirmation: "",
  });

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- MANUAL REGISTRATION ---
  async function handleRegisterSubmit() {
    setIsLoading(true);
    setGeneralError(null);

    if (formData.password !== formData.password_confirmation) {
      setGeneralError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`,
        email: user.email,
        created_at: serverTimestamp(),
      });
      
      // Note: Firebase `sendEmailVerification` and `signOut` are used here.
      await sendEmailVerification(user);
      await signOut(auth);

      // Navigate to the Login screen, passing the success message in params
      // Replaces: navigate('/login', { state: { message: ... } });
      navigation.navigate('Login', { 
        message: 'Registration successful! Please check your email to verify your account before logging in.'
      });

    } catch (error: any) {
      let errorMessage = 'Failed to register. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      }
      setGeneralError(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // --- GOOGLE SIGN-UP / SIGN-IN ---
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
          last_name: nameParts.slice(1).join(" ") || "", // Handle names with multiple parts
          full_name: user.displayName,
          email: user.email,
          created_at: serverTimestamp(),
        });
      }
      
      // Navigate to the dashboard (main protected stack). The user is now logged in.
      // Replaces: navigate("/");
      navigation.navigate("HomeStack"); 

    } catch (error) {
      setGeneralError("Failed to sign up with Google. Please try again.");
      console.error('Google sign-up error:', error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleInputChange = useCallback((id: keyof RegisterFormData, value: string) => {
    setFormData((prev: RegisterFormData) => ({ ...prev, [id]: value }));
    setGeneralError(null); // Clear error on input change
  }, []);

  // Handler for the main form submission button
  const handleSubmit = () => {
    if (!isLoading) {
        handleRegisterSubmit();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.loginWrapper}>
        <View style={styles.loginCard}>
          <Text style={styles.title}>Create an account</Text>
  
          {/* --- GOOGLE SIGN-UP --- */}
          <View style={styles.socialLoginContainer}>
            <TouchableOpacity 
                onPress={handleGoogleSignIn} 
                style={styles.secondaryBtn}
                disabled={isLoading}
            >
                <GoogleIcon style={styles.googleIcon} />
                <Text style={styles.secondaryBtnText}>Sign Up With Google</Text>
            </TouchableOpacity>
          </View>
  
          {/* --- "OR" DIVIDER --- */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine}></View>
            <Text style={styles.dividerText}>OR SIGN UP WITH EMAIL</Text>
            <View style={styles.dividerLine}></View>
          </View>
  
          {/* --- MANUAL EMAIL FORM (View replaces form) --- */}
          <View style={styles.formContainer}>
            <View style={styles.nameFieldsGrid}>
                {/* First Name */}
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>First Name</Text>
                    <TextInput
                        style={styles.formInput}
                        autoCapitalize="words"
                        value={formData.first_name}
                        onChangeText={(text) => handleInputChange("first_name", text)}
                        editable={!isLoading}
                    />
                </View>
                {/* Last Name */}
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Last Name</Text>
                    <TextInput
                        style={styles.formInput}
                        autoCapitalize="words"
                        value={formData.last_name}
                        onChangeText={(text) => handleInputChange("last_name", text)}
                        editable={!isLoading}
                    />
                </View>
            </View>
            
            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email address</Text>
              <TextInput
                style={styles.formInput}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => handleInputChange("email", text)}
                editable={!isLoading}
              />
            </View>
            
            {/* Password */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Password</Text>
              <TextInput
                style={styles.formInput}
                secureTextEntry
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                editable={!isLoading}
              />
            </View>
            
            {/* Confirm Password */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Confirm Password</Text>
              <TextInput
                style={styles.formInput}
                secureTextEntry
                value={formData.password_confirmation}
                onChangeText={(text) => handleInputChange("password_confirmation", text)}
                editable={!isLoading}
              />
            </View>
            
            {/* Error Message */}
            {generalError && <Text style={styles.errorText}>{generalError}</Text>}
            
            {/* Submit Button */}
            <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={handleSubmit}
                disabled={isLoading}
            > 
                <Text style={styles.primaryBtnText}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
            </TouchableOpacity>
          </View>
  
          <Text style={styles.registerPrompt}>
            Already have an account? {' '}
            <Text 
                style={styles.textLink} 
                onPress={() => navigation.navigate("Login")} // RN Navigation
            >
                Sign in here
            </Text>
          </Text>
        </View>
      </ScrollView>
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
        // space-y-6 equivalent
    },
    formGroup: {
        marginBottom: 24, // mb-6
        position: 'relative',
    },
    nameFieldsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16, // gap-4
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
    
    errorText: {
        marginTop: 8, // mt-2
        fontSize: 14, // text-sm
        color: '#dc2626', // text-red-600 (className="error")
        textAlign: 'center', // Added for better visibility
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
    textLink: {
        fontSize: 14, // text-sm
        fontWeight: '600', // font-semibold
        color: '#4f46e5', // text-indigo-600
    },
});