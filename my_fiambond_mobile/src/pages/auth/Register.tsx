"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Image,
  Alert,
  useWindowDimensions,
  Pressable,
  Animated
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "@/config/firebase-config";
import { 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// --- UPDATED IMPORT ---
import { GOOGLE_AUTH_CONFIG } from "@/config/apiConfig";

// Custom components
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

// Conditionally require GoogleSignin for native platforms only
const GoogleSignin = Platform.OS !== 'web' ? require("@react-native-google-signin/google-signin").GoogleSignin : null;

interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "", 
    last_name: "", 
    email: "", 
    password: "", 
    password_confirmation: "",
  });
  
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Animations for buttons
  const googleScale = useRef(new Animated.Value(1)).current;
  const submitScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 0.98, useNativeDriver: true }).start();
  };
  const handlePressOut = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
  };

  // --- CONFIG: Google Sign In (Updated to use apiconfig) ---
  useEffect(() => {
    if (Platform.OS !== 'web' && GoogleSignin) {
      GoogleSignin.configure(GOOGLE_AUTH_CONFIG);
    }
  }, []);

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setGeneralError(null);
  };

  const saveUserToFirestore = async (user: any, customData?: Partial<RegisterFormData>) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const nameParts = user.displayName?.split(" ") || ["", ""];
      await setDoc(userDocRef, {
        first_name: customData?.first_name || nameParts[0],
        last_name: customData?.last_name || (nameParts.slice(1).join(" ") || ""),
        full_name: customData ? `${customData.first_name} ${customData.last_name}` : user.displayName,
        email: user.email,
        created_at: serverTimestamp(),
        role: 'user'
      });
    }
  };

  async function handleRegisterSubmit() {
    setGeneralError(null);
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      setGeneralError("Please fill in all required fields.");
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      setGeneralError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await saveUserToFirestore(userCredential.user, formData);
      await signOut(auth);
      router.push('/(auth)/login');
    } catch (error: any) {
      setGeneralError(error.code === 'auth/email-already-in-use' ? 'Email already registered.' : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleGoogleSignUp = async () => {
    setGeneralError(null);
    setIsSubmitting(true);
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await saveUserToFirestore(result.user);
      } else {
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        const idToken = response.data?.idToken || response.idToken;
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        await saveUserToFirestore(result.user);
      }
    } catch (error: any) {
      setGeneralError("Google sign-up failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for Input Styling to replicate focus:ring-2
  const getInputStyle = (id: string) => ({
    borderWidth: 1,
    borderColor: focusedInput === id ? '#6366f1' : '#e5e7eb', // focus:ring-indigo-500
    backgroundColor: focusedInput === id ? '#ffffff' : '#f9fafb',
    elevation: focusedInput === id ? 2 : 0,
    shadowColor: '#6366f1',
    shadowOpacity: focusedInput === id ? 0.1 : 0,
    shadowRadius: 4,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {isSubmitting && (
        <UnifiedLoadingWidget type="fullscreen" message="Creating your account..." variant="indigo" />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }} 
          className="px-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card Container (max-w-md = 448px) */}
          <View 
            style={{ width: '100%', maxWidth: 448 }}
            className="bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl shadow-gray-200 border border-gray-100"
          >
            {/* Header */}
            <View className="mb-8 items-center">
                <Text className="text-3xl font-extrabold text-gray-900 tracking-tight text-center">
                  Create Account
                </Text>
                <Text className="text-gray-500 mt-2 font-medium">
                  Join the FiamBond Realm
                </Text>
            </View>

            {/* Google Sign Up */}
            <Animated.View style={{ transform: [{ scale: googleScale }] }}>
              <Pressable 
                onPressIn={() => handlePressIn(googleScale)}
                onPressOut={() => handlePressOut(googleScale)}
                onPress={handleGoogleSignUp} 
                disabled={isSubmitting}
                className="flex-row items-center justify-center bg-white border border-gray-300 py-3.5 rounded-xl shadow-sm"
              > 
                <Image 
                  source={{ uri: 'https://www.svgrepo.com/show/475656/google-color.svg' }} 
                  style={{ width: 20, height: 20, marginRight: 12 }}
                />
                <Text className="font-bold text-gray-700 text-sm">Sign Up With Google</Text>
              </Pressable>
            </Animated.View>

            {/* Separator */}
            <View className="flex-row items-center py-8">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                Or use email
              </Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Form */}
            <View className="space-y-5">
              
              {/* Name Row (Grid replication) */}
              <View className="flex-row" style={{ gap: 16 }}>
                <View className="flex-1 space-y-1">
                  <Text className="text-sm font-bold text-gray-700 ml-1">First Name</Text>
                  <TextInput 
                    onFocus={() => setFocusedInput('first')}
                    onBlur={() => setFocusedInput(null)}
                    style={[getInputStyle('first'), { padding: 14, borderRadius: 12 }]}
                    className="text-gray-900 text-sm transition-all"
                    placeholder="John"
                    placeholderTextColor="#9ca3af"
                    value={formData.first_name}
                    onChangeText={(val) => handleInputChange('first_name', val)}
                  />
                </View>
                <View className="flex-1 space-y-1">
                  <Text className="text-sm font-bold text-gray-700 ml-1">Last Name</Text>
                  <TextInput 
                    onFocus={() => setFocusedInput('last')}
                    onBlur={() => setFocusedInput(null)}
                    style={[getInputStyle('last'), { padding: 14, borderRadius: 12 }]}
                    className="text-gray-900 text-sm transition-all"
                    placeholder="Doe"
                    placeholderTextColor="#9ca3af"
                    value={formData.last_name}
                    onChangeText={(val) => handleInputChange('last_name', val)}
                  />
                </View>
              </View>

              {/* Email */}
              <View className="space-y-1">
                <Text className="text-sm font-bold text-gray-700 ml-1">Email address</Text>
                <TextInput 
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  style={[getInputStyle('email'), { padding: 14, borderRadius: 12 }]}
                  className="text-gray-900 text-sm transition-all"
                  placeholder="name@example.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val) => handleInputChange('email', val)}
                />
              </View>

              {/* Password */}
              <View className="space-y-1">
                <Text className="text-sm font-bold text-gray-700 ml-1">Password</Text>
                <TextInput 
                  onFocus={() => setFocusedInput('pass')}
                  onBlur={() => setFocusedInput(null)}
                  style={[getInputStyle('pass'), { padding: 14, borderRadius: 12 }]}
                  className="text-gray-900 text-sm transition-all"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(val) => handleInputChange('password', val)}
                />
              </View>

              {/* Confirm Password */}
              <View className="space-y-1">
                <Text className="text-sm font-bold text-gray-700 ml-1">Confirm Password</Text>
                <TextInput 
                  onFocus={() => setFocusedInput('confirm')}
                  onBlur={() => setFocusedInput(null)}
                  style={[getInputStyle('confirm'), { padding: 14, borderRadius: 12 }]}
                  className="text-gray-900 text-sm transition-all"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={formData.password_confirmation}
                  onChangeText={(val) => handleInputChange('password_confirmation', val)}
                />
              </View>
              
              {/* Error Message */}
              {generalError && (
                <View className="bg-red-50 border border-red-100 p-3 rounded-xl mt-2">
                  <Text className="text-red-600 text-center font-bold text-xs">
                    {generalError}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <Animated.View style={{ transform: [{ scale: submitScale }] }}>
                <Pressable 
                  onPressIn={() => handlePressIn(submitScale)}
                  onPressOut={() => handlePressOut(submitScale)}
                  onPress={handleRegisterSubmit}
                  disabled={isSubmitting}
                  className={`bg-indigo-600 py-4 rounded-xl items-center mt-4 shadow-lg shadow-indigo-100 ${isSubmitting ? 'opacity-70' : ''}`}
                >
                  <Text className="text-white font-bold text-base">Create Account</Text>
                </Pressable>
              </Animated.View>
            </View>

            {/* Footer Link */}
            <View className="flex-row justify-center mt-10">
              <Text className="text-gray-500 font-medium text-sm">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text className="text-indigo-600 font-bold text-sm">Sign in here</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}