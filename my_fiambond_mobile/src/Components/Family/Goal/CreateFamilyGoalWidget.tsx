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

// Cloudinary constants (use process.env in RN/Expo)
const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const API_URL = 'http://localhost:3000/api'; // Simplified URL

// --- INTERFACES FOR TYPE SAFETY ---
interface Props {
    family: { id: string; family_name?: string };
    onSuccess?: () => void;
}
interface User { 
    uid: string; 
    [key: string]: any; 
}
interface AppContextType { 
    user: User | null; 
    [key: string]: any; 
}
// ------------------------------------

// NOTE: For a production app, the date input should be replaced with a native date picker
// component like '@react-native-community/datetimepicker' or similar.

export default function CreateFamilyGoalWidget({ family, onSuccess }: Props) {
    // FIX: Assert context type with non-null assertion (!)
    const { user } = useContext(AppContext)! as AppContextType; 

    const [formData, setFormData] = useState({ name: '', target_amount: '', target_date: '' });
    const [loading, setLoading] = useState(false);

    const handleCreateGoal = async () => {
        // Safe check for user object access (user is now User | null)
        if (!user || !user.uid) return Alert.alert("Error", "Login required");
        
        if (!formData.name || !formData.target_amount || !formData.target_date) {
            return Alert.alert("Error", "All fields are required.");
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid, // SAFE access now
                    family_id: family.id,
                    name: formData.name,
                    target_amount: parseFloat(formData.target_amount),
                    target_date: new Date(formData.target_date).toISOString(),
                    status: 'active'
                })
            });

            if (!res.ok) throw new Error("Failed");

            Alert.alert("Success", "Family Goal Set!");
            setFormData({ name: '', target_amount: '', target_date: '' });
            onSuccess?.();
        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", "Error creating goal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Name */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Goal Name</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Family Vacation"
                    value={formData.name}
                    onChangeText={text => setFormData({...formData, name: text})}
                    editable={!loading}
                />
            </View>

            {/* Amount */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Target Amount (₱)</Text>
                <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="0.00"
                    value={formData.target_amount}
                    onChangeText={text => setFormData({...formData, target_amount: text.replace(/[^0-9.]/g, '')})}
                    editable={!loading}
                />
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Deadline</Text>
                {/* RN Date Input: Replaced with a simple text input. Use native picker in prod. */}
                <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD"
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                    value={formData.target_date}
                    onChangeText={text => setFormData({...formData, target_date: text})}
                    editable={!loading}
                />
                {Platform.OS === 'web' && <Text style={styles.datePlaceholder}>Note: Use a native DatePicker in production.</Text>}
            </View>

            <TouchableOpacity 
                onPress={handleCreateGoal} 
                disabled={loading || !formData.name || !formData.target_amount || !formData.target_date} 
                style={[
                    styles.submitButton, 
                    (loading || !formData.name || !formData.target_amount || !formData.target_date) && styles.disabledButton
                ]}
            >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Set Family Goal</Text>}
            </TouchableOpacity>
        </View>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: {
        padding: 16, 
        gap: 16, 
    },
    formGroup: {
        gap: 4, 
    },
    label: {
        fontSize: 14, 
        fontWeight: 'bold',
        color: '#374151', 
    },
    textInput: {
        width: '100%',
        padding: 12, 
        borderWidth: 1,
        borderColor: '#E5E7EB', 
        borderRadius: 8, 
        backgroundColor: 'white',
        color: '#334155', 
        fontSize: 16,
    },
    datePlaceholder: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    submitButton: {
        width: '100%',
        paddingVertical: 12, 
        backgroundColor: '#4F46E5', 
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5, 
        marginTop: 8, 
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.5,
    }
});