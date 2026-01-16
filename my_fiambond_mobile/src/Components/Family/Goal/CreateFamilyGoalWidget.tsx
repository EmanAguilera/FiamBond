import React, { useContext, useState } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert, 
    Platform,
    ScrollView
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from "../../../Context/AppContext";

interface Props {
  family: { id: string; family_name?: string };
  onSuccess?: () => void;
}

export default function CreateFamilyGoalWidget({ family, onSuccess }: Props) {
  const { user } = useContext(AppContext) as any;
  // Replace with your local machine IP if testing on a physical device
  const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev/api';

  const [formData, setFormData] = useState({ 
      name: "", 
      target_amount: "", 
      target_date: new Date() 
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateGoal = async () => {
    if (!user) return Alert.alert("Error", "Login required");
    if (!formData.name || !formData.target_amount) {
        return Alert.alert("Error", "Please fill in all required fields.");
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          family_id: family.id,
          name: formData.name,
          target_amount: parseFloat(formData.target_amount),
          target_date: formData.target_date.toISOString(),
          status: "active",
        }),
      });

      if (!res.ok) throw new Error('Failed');
      
      Alert.alert("Success", "Family Goal Set!");
      setFormData({ name: "", target_amount: "", target_date: new Date() });
      onSuccess?.();
    } catch (err) {
      Alert.alert("Error", "Could not create the family goal.");
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    if (selectedDate) {
      setFormData({ ...formData, target_date: selectedDate });
    }
  };

  const inputLabelClass = "text-sm font-bold text-slate-700 mb-2";
  const inputFieldClass = "w-full p-4 border border-slate-200 rounded-2xl bg-white text-slate-700 text-base mb-5";

  return (
    <ScrollView className="flex-1 p-1" keyboardShouldPersistTaps="handled">
      {/* Goal Name */}
      <View>
        <Text className={inputLabelClass}>Goal Name</Text>
        <TextInput
          placeholder="e.g. Family Vacation"
          placeholderTextColor="#94a3b8"
          value={formData.name}
          onChangeText={(val) => setFormData({...formData, name: val})}
          className={inputFieldClass}
        />
      </View>

      {/* Amount */}
      <View>
        <Text className={inputLabelClass}>Target Amount (₱)</Text>
        <TextInput
          placeholder="0.00"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={formData.target_amount}
          onChangeText={(val) => setFormData({...formData, target_amount: val})}
          className={inputFieldClass}
        />
      </View>

      {/* Date Selector */}
      <View>
        <Text className={inputLabelClass}>Target Date</Text>
        <TouchableOpacity 
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
          className={inputFieldClass}
        >
          <Text className={formData.target_date ? "text-slate-700" : "text-slate-400"}>
            {formData.target_date.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={formData.target_date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
            minimumDate={new Date()}
          />
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity 
        onPress={handleCreateGoal}
        disabled={loading}
        activeOpacity={0.8}
        className={`w-full py-5 rounded-2xl shadow-lg items-center mt-2 ${
            loading ? 'bg-indigo-300' : 'bg-indigo-600'
        }`}
        style={!loading && { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
      >
        {loading ? (
          <View className="flex-row items-center">
            <ActivityIndicator color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg">Setting Goal...</Text>
          </View>
        ) : (
          <Text className="text-white font-bold text-lg">Set Family Goal</Text>
        )}
      </TouchableOpacity>

      <View className="mt-6 px-4">
        <Text className="text-xs text-center text-slate-400 italic leading-4">
            This goal will be visible to all members of <Text className="font-bold text-indigo-500">{family.family_name || 'the family'}</Text>.
        </Text>
      </View>

      {/* Bottom padding for keyboard avoidance */}
      <View className="h-20" />
    </ScrollView>
  );
}