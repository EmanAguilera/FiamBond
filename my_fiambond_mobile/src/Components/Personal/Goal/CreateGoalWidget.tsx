import React, { useState, useContext } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert, 
    Platform 
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from "../../../Context/AppContext";

interface CreateGoalWidgetProps {
    onSuccess?: () => void;
}

export default function CreateGoalWidget({ onSuccess }: CreateGoalWidgetProps) {
    // Cast context to any for safety with existing JS context files
    const context = useContext(AppContext) as any;
    const user = context?.user;
    
    // Replace with your local IP if testing on a physical device
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
            return Alert.alert("Error", "Please fill in all fields");
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid,
                    family_id: null, 
                    name: formData.name,
                    target_amount: parseFloat(formData.target_amount),
                    target_date: formData.target_date.toISOString(),
                    status: "active",
                }),
            });

            if (!res.ok) throw new Error('Server error');

            Alert.alert("Success", "Goal Set Successfully");
            setFormData({ name: "", target_amount: "", target_date: new Date() });
            onSuccess?.();
        } catch (err) {
            Alert.alert("Error", "Error creating goal");
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

    const inputClass = "w-full p-4 border border-slate-200 rounded-2xl bg-white text-slate-700 text-base mb-4";

    return (
        <View className="p-1">
            {/* Goal Name */}
            <View>
                <Text className="text-sm font-bold text-slate-700 mb-2">Goal Name</Text>
                <TextInput
                    placeholder="e.g. New Laptop"
                    placeholderTextColor="#94a3b8"
                    value={formData.name}
                    onChangeText={text => setFormData({...formData, name: text})}
                    className={inputClass}
                />
            </View>

            {/* Amount */}
            <View>
                <Text className="text-sm font-bold text-slate-700 mb-2">Target Amount (₱)</Text>
                <TextInput
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={formData.target_amount}
                    onChangeText={text => setFormData({...formData, target_amount: text})}
                    className={inputClass} 
                />
            </View>

            {/* Date Selector */}
            <View>
                <Text className="text-sm font-bold text-slate-700 mb-2">Target Date</Text>
                <TouchableOpacity 
                    onPress={() => setShowDatePicker(true)}
                    className={inputClass}
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
                activeOpacity={0.7}
                className={`w-full py-4 rounded-2xl shadow-lg items-center mt-2 ${
                    loading ? 'bg-indigo-300' : 'bg-indigo-600'
                }`}
                style={!loading && { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-bold text-lg">Set Goal</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}