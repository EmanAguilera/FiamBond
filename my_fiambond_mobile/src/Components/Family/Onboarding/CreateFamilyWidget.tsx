import React, { useState, useContext } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Platform 
} from "react-native";
import { AppContext } from "../../../Context/AppContext.jsx";

// Cloudinary constants (these are unused but kept for context consistency)
const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const API_URL = 'http://localhost:3000/api'; // Simplified URL

// --- INTERFACES FOR TYPE SAFETY ---
interface NewFamily {
  id: string;
  family_name: string;
  owner_id: string;
}

interface CreateFamilyWidgetProps {
  onSuccess?: (newFamily: NewFamily) => void;
}

// Interfaces for Context Fix (Error 2339)
interface User { 
    uid: string; 
    [key: string]: any; 
}
interface AppContextType { 
    user: User | null; 
    [key: string]: any; 
}
// ------------------------------------

export default function CreateFamilyWidget({ onSuccess }: CreateFamilyWidgetProps) {
  // FIX 1: Assert context type with non-null assertion (!)
  const { user } = useContext(AppContext)! as AppContextType; 
  const API_URL = 'http://localhost:3000/api'; 

  const [familyName, setFamilyName] = useState<string>("");
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateFamily = async () => {
    // Safe check for user object access (user is now User | null)
    if (!user || !user.uid) {
      setGeneralError("You must be logged in to perform this action.");
      Alert.alert("Error", "You must be logged in to perform this action.");
      return;
    }
    if (!familyName.trim()) {
        setGeneralError("Please enter a family name.");
        return;
    }

    setGeneralError(null);
    setLoading(true);

    try {
      // 1. Prepare Payload for MongoDB
      const familyData = {
        family_name: familyName,
        owner_id: user.uid, // SAFE access now
        member_ids: [user.uid], // SAFE access now
      };

      // 2. Send POST Request
      const response = await fetch(`${API_URL}/families`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(familyData),
      });

      if (!response.ok) {
        throw new Error('Failed to create family on server.');
      }

      const newFamilyDoc = await response.json();

      setFamilyName("");
      
      // 3. Handle Success
      if (onSuccess) {
        onSuccess({
          id: newFamilyDoc._id, // Map MongoDB '_id' to 'id'
          family_name: newFamilyDoc.family_name,
          owner_id: newFamilyDoc.owner_id,
        });
      }
    } catch (error) {
      console.error('Failed to create family:', error);
      setGeneralError('A network error occurred. Please check your connection.');
      Alert.alert("Error", "Failed to create family. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formGroup}>
        <TextInput
          style={styles.textInput}
          placeholder="Family Name (e.g., Smith Household)"
          value={familyName}
          onChangeText={setFamilyName}
          // FIX 2: Replaced 'disabled={loading}' with 'editable={!loading}'
          editable={!loading} 
          // FIX 2: Removed 'required' prop
        />
      </View>
      {generalError && <Text style={styles.errorText}>{generalError}</Text>}
      <TouchableOpacity 
        onPress={handleCreateFamily} 
        style={[styles.primaryBtn, loading && styles.btnDisabled]}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>Create Family</Text>}
      </TouchableOpacity>
    </View>
  );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 16, // Simulating widget padding
        gap: 16, // space-y-4
    },
    formGroup: {
        // Simple container for input
    },
    textInput: {
        width: '100%', // w-full
        padding: 10, // p-2
        borderWidth: 1,
        borderColor: '#D1D5DB', // border-gray-300
        borderRadius: 6, // rounded-md
        color: '#1F2937',
        fontSize: 16,
    },
    errorText: {
        color: '#EF4444', // error
        textAlign: 'center',
        fontSize: 14,
    },
    primaryBtn: {
        width: '100%', // w-full
        paddingVertical: 12, // py-3
        backgroundColor: '#4F46E5', // primary-btn / bg-indigo-600
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4, // shadow-md
    },
    primaryBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    btnDisabled: {
        opacity: 0.5,
    },
});