import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { auth, db } from "../../config/firebase-config";
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  GoogleAuthProvider, 
  signInWithCredential 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "818608486797-pujgl59qscfvqpek8o4m6vebnb7cbfs2.apps.googleusercontent.com",
      iosClientId: "818608486797-c2rrbocuvhu54jiiu3lnp28hn6hdlade.apps.googleusercontent.com",
    });
  }, []);

  useEffect(() => {
    if (route.params?.message) {
      Alert.alert("Account Created", route.params.message);
      navigation.setParams({ message: undefined });
    }
  }, [route.params?.message]);

  const handleInputChange = (id: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    setGeneralError(null);
  };

  const handleLoginSubmit = async () => {
    if (!formData.email || !formData.password) {
      setGeneralError("Please enter both email and password.");
      return;
    }
    setGeneralError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
    } catch (error: any) {
      setGeneralError("Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      // In newer versions of the library, idToken is inside response.data
      const idToken = response.data?.idToken;

      if (!idToken) {
        throw new Error("No ID Token found");
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

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
    } catch (error) {
      Alert.alert("Error", "Failed to sign in with Google. Please try again.");
      console.error('Google sign-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setGeneralError("Please enter your email address to reset your password.");
      return;
    }
    setGeneralError(null);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      Alert.alert("Email Sent", "Check your inbox for password reset instructions.");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setGeneralError("No account found with this email address.");
      } else {
        Alert.alert("Error", "Failed to send reset email.");
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <Text className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Sign in</Text>
            <TouchableOpacity onPress={handleGoogleSignIn} disabled={loading} className="flex-row items-center justify-center bg-white border border-gray-300 py-4 rounded-xl mb-6">
              <Text className="text-gray-700 font-bold text-base">Sign In With Google</Text>
            </TouchableOpacity>
            <View className="flex-row items-center mb-8">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="mx-4 text-xs text-gray-400 font-bold">OR CONTINUE WITH</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>
            <View>
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Email address</Text>
                <TextInput className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900" placeholder="john.doe@example.com" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={(val) => handleInputChange("email", val)} />
              </View>
              <View className="mb-2">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Password</Text>
                <TextInput className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900" placeholder="••••••••" secureTextEntry value={formData.password} onChangeText={(val) => handleInputChange("password", val)} />
              </View>
              <TouchableOpacity onPress={handlePasswordReset} className="items-end mb-6">
                <Text className="text-sm text-indigo-600 font-semibold">Forgot Password?</Text>
              </TouchableOpacity>
              {generalError && <Text className="text-red-500 text-sm mb-4 text-center font-medium">{generalError}</Text>}
              <TouchableOpacity onPress={handleLoginSubmit} disabled={loading} className="bg-indigo-600 py-4 rounded-xl items-center">
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Sign In</Text>}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Register")} className="mt-8 items-center">
              <Text className="text-gray-600 text-sm">Don't have an account? <Text className="text-indigo-600 font-bold">Register here</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}