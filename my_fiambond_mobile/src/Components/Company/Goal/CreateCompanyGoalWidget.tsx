import React, { useState, useContext } from "react";
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
    company: { id: string | number };
    onSuccess?: () => void;
}

export default function CreateCompanyGoalWidget({ company, onSuccess }: Props) {
    const { user } = useContext(AppContext) as any;
    
    // Replace with your actual local machine IP for physical device testing
    const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev/api';

    const [formData, setFormData] = useState({ 
        name: '', 
        target_amount: '', 
        target_date: new Date() 
    });
    
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
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
                    company_id: company.id,
                    name: formData.name,
                    target_amount: parseFloat(formData.target_amount),
                    target_date: formData.target_date.toISOString(),
                    status: 'active'
                })
            });

            if (!res.ok) throw new Error("Server communication failed");

            Alert.alert("Success", "Strategic Target Set!");
            
            // Reset state
            setFormData({ name: '', target_amount: '', target_date: new Date() });
            
            if (onSuccess) onSuccess();
        } catch (error) {
            Alert.alert("Error", "Could not create the corporate target.");
        } finally {
            setLoading(false);
        }
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios'); // Keep picker open on iOS, auto-close on Android
        if (selectedDate) {
            setFormData({ ...formData, target_date: selectedDate });
        }
    };

    const labelClass = "text-sm font-bold text-slate-700 mb-2";
    const inputClass = "w-full p-4 border border-slate-200 rounded-2xl bg-white text-slate-800 text-base mb-5";

    return (
        <ScrollView className="flex-1 p-1" keyboardShouldPersistTaps="handled">
            
            {/* Target Name Input */}
            <View>
                <Text className={labelClass}>Target Name</Text>
                <TextInput 
                    placeholder="e.g. Q4 Revenue"
                    placeholderTextColor="#94a3b8"
                    value={formData.name}
                    onChangeText={(val) => setFormData({...formData, name: val})}
                    className={inputClass}
                    editable={!loading}
                />
            </View>

            {/* Target Amount Input */}
            <View>
                <Text className={labelClass}>Target Amount (₱)</Text>
                <TextInput 
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={formData.target_amount}
                    onChangeText={(val) => setFormData({...formData, target_amount: val})}
                    className={inputClass}
                    editable={!loading}
                />
            </View>

            {/* Deadline Date Picker */}
            <View>
                <Text className={labelClass}>Deadline</Text>
                <TouchableOpacity 
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                    className={inputClass}
                    disabled={loading}
                >
                    <Text className="text-slate-800 font-medium">
                        {formData.target_date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
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
                onPress={handleSubmit} 
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
                        <Text className="text-white font-bold text-lg">Setting Target...</Text>
                    </View>
                ) : (
                    <Text className="text-white font-bold text-lg">Set Strategic Target</Text>
                )}
            </TouchableOpacity>

            {/* Footer Hint */}
            <View className="mt-8 px-4">
                <Text className="text-[10px] text-center text-slate-400 italic leading-4">
                    This target will be tracked by the <Text className="font-bold text-indigo-500">Corporate Realm</Text> and visible to all authorized administrators.
                </Text>
            </View>

            {/* Bottom Padding for Keyboard Scroll */}
            <View className="h-20" />

        </ScrollView>
    );
}