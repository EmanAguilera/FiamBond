import React, { useContext, useState } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert 
} from "react-native";
import { AppContext } from "../../../Context/AppContext.jsx";

// --- TypeScript Interfaces ---
interface NewFamily {
  id: string;
  family_name: string;
  owner_id: string;
}

interface CreateFamilyWidgetProps {
  onSuccess?: (newFamily: NewFamily) => void;
}

export default function CreateFamilyWidget({ onSuccess }: CreateFamilyWidgetProps) {
  const context = useContext(AppContext) as any;
  const user = context?.user;
  
  // Use local IP for physical device testing, or localhost for simulator
  const API_URL = 'http://localhost:3000';

  const [familyName, setFamilyName] = useState<string>("");
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateFamily = async () => {
    if (!user) {
      Alert.alert("Authentication Required", "You must be logged in to perform this action.");
      return;
    }

    if (!familyName.trim()) {
        setGeneralError("Family name cannot be empty.");
        return;
    }

    setGeneralError(null);
    setLoading(true);

    try {
      // 1. Prepare Payload
      const familyData = {
        family_name: familyName,
        owner_id: user.uid,
        member_ids: [user.uid],
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
      Alert.alert("Success", "Family realm created successfully!");
      
      if (onSuccess) {
        onSuccess({
          id: newFamilyDoc._id,
          family_name: newFamilyDoc.family_name,
          owner_id: newFamilyDoc.owner_id,
        });
      }
    } catch (error) {
      console.error('Failed to create family:', error);
      setGeneralError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="w-full p-1">
      <View className="space-y-4">
        {/* Label */}
        <Text className="text-sm font-bold text-slate-700 mb-2">Family Name</Text>
        
        {/* Input Field */}
        <TextInput
          placeholder="e.g., Smith Household"
          placeholderTextColor="#94a3b8"
          value={familyName}
          onChangeText={setFamilyName}
          className="w-full p-4 border border-slate-200 rounded-2xl bg-white text-slate-800 text-base mb-4"
          editable={!loading}
        />

        {/* Error Message */}
        {generalError && (
          <View className="bg-rose-50 p-3 rounded-xl mb-4">
            <Text className="text-rose-600 text-xs text-center font-medium">
                {generalError}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity 
          onPress={handleCreateFamily} 
          disabled={loading}
          activeOpacity={0.7}
          className={`w-full py-4 rounded-2xl shadow-lg items-center ${
            loading ? 'bg-indigo-300' : 'bg-indigo-600'
          }`}
          style={!loading && { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
        >
          {loading ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" className="mr-2" />
              <Text className="text-white font-bold text-lg">Creating...</Text>
            </View>
          ) : (
            <Text className="text-white font-bold text-lg">Create Family Realm</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <View className="mt-4 px-2">
            <Text className="text-[10px] text-center text-slate-400 italic leading-4">
                Creating a family realm allows you to share transactions, goals, and track loans with other users.
            </Text>
        </View>
      </View>
    </View>
  );
}