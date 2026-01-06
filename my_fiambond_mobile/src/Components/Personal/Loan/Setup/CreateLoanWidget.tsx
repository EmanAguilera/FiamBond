import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    Platform 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AppContext } from '../../../../Context/AppContext.jsx';

// Cloudinary constants (use process.env in RN/Expo)
const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const API_URL = 'http://localhost:3000/api'; // Simplified URL

// --- INTERFACES FOR TYPE SAFETY ---
interface Member { id: string; full_name: string; [key: string]: any; }
interface CreateLoanWidgetProps { family: { id: string }; members: Member[]; onSuccess?: () => void; }

// Placeholder type for the native file/receipt object
interface NativeFile {
    uri: string;
    name: string;
    type: string; // e.g., 'image/jpeg', 'application/pdf'
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


export default function CreateLoanWidget({ family, members, onSuccess }: CreateLoanWidgetProps) {
  // FIX: Assert context type with non-null assertion (!)
  const { user } = useContext(AppContext)! as AppContextType; 
  const [form, setForm] = useState({ amount: "", interest: "", desc: "", debtorId: "", deadline: "" });
  const [file, setFile] = useState<NativeFile | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter out current user
  // Safe access to user is now guaranteed by the assertion above
  const otherMembers = (members || []).filter(m => String(m.id) !== String(user?.uid)); 

  // Placeholder for native file picker
  const handleNativeFileUpload = async () => {
    Alert.alert("File Picker", "Native file picker integration required.");
    
    // Simulating file selection for development:
    // setFile({ uri: 'file:///temp/receipt.jpg', name: 'receipt.jpg', type: 'image/jpeg' });
  };

  const submit = async () => {
    // Safe check for user object access (user is now User | null)
    if (!user || !user.uid) return Alert.alert("Error", "Login required");
    if (!form.debtorId) return Alert.alert("Error", "Please select a member to lend to.");
    if (!form.amount) return Alert.alert("Error", "Please enter an amount.");

    setLoading(true);
    try {
      let attachment_url = null;
      if (file) {
        const fd = new FormData();
        
        // Append the native file object to FormData
        fd.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.type,
        } as any);

        fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        const res = await fetch(CLOUD_URL, { 
            method: 'POST', 
            body: fd,
            // RN handles Content-Type for multipart/form-data automatically
            headers: {}, 
        });
        
        if (res.ok) attachment_url = (await res.json()).secure_url;
      }

      const debtorName = members.find(m => String(m.id) === String(form.debtorId))?.full_name || 'Member';
      const principal = parseFloat(form.amount) || 0;
      const interest = parseFloat(form.interest || '0') || 0;

      // 1. Create Loan Record
      const loanRes = await fetch(`${API_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: family.id,
          creditor_id: user.uid, // SAFE access now
          debtor_id: form.debtorId,
          debtor_name: debtorName,
          amount: principal,
          interest_amount: interest,
          total_owed: principal + interest,
          repaid_amount: 0,
          description: form.desc,
          deadline: form.deadline ? new Date(form.deadline) : null,
          status: "pending_confirmation",
          attachment_url
        })
      });

      if (!loanRes.ok) throw new Error("Loan creation failed");

      // 2. Record Transaction (Expense)
      await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid, // SAFE access now
          family_id: null,
          type: "expense",
          amount: principal,
          description: `Loan to ${debtorName}: ${form.desc}`,
          attachment_url,
          created_at: new Date().toISOString()
        })
      });

      Alert.alert("Success", "Loan Request Sent to Debtor");
      setForm({ amount: "", interest: "", desc: "", debtorId: "", deadline: "" });
      setFile(null);
      onSuccess?.();
    } catch (e: any) { 
        console.error(e);
        Alert.alert("Error", "Error processing loan."); 
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Lending To */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Lending To</Text>
        <View style={styles.pickerWrapper}>
            <Picker
                selectedValue={form.debtorId}
                onValueChange={itemValue => setForm({ ...form, debtorId: itemValue as string })}
                style={styles.picker}
                enabled={!loading}
            >
                <Picker.Item label={otherMembers.length > 0 ? "Select Family Member" : "No other members"} value="" enabled={false} />
                {otherMembers.map(m => (
                    <Picker.Item key={m.id} label={m.full_name} value={m.id} />
                ))}
            </Picker>
        </View>
      </View>

      {/* Amount & Interest */}
      <View style={styles.amountGroup}>
        <View style={styles.amountInputWrapper}>
          <Text style={styles.label}>Amount (₱)</Text>
          <TextInput 
            style={[styles.textInput, styles.amountInput]}
            keyboardType="numeric"
            placeholder="0.00"
            value={form.amount}
            onChangeText={text => setForm({ ...form, amount: text.replace(/[^0-9.]/g, '') })}
            editable={!loading}
          />
        </View>
        <View style={styles.amountInputWrapper}>
          <Text style={styles.label}>Interest (Optional)</Text>
          <TextInput 
            style={[styles.textInput, styles.amountInput]}
            keyboardType="numeric"
            placeholder="0.00"
            value={form.interest}
            onChangeText={text => setForm({ ...form, interest: text.replace(/[^0-9.]/g, '') })}
            editable={!loading}
          />
        </View>
      </View>

      {/* Description */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput 
          style={styles.textInput}
          placeholder="e.g. Lunch money" 
          value={form.desc}
          onChangeText={text => setForm({ ...form, desc: text })}
          editable={!loading}
        />
      </View>

      {/* Deadline */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Deadline <Text style={styles.labelOptional}>(Optional)</Text></Text>
        <TextInput 
            style={styles.textInput}
            placeholder="YYYY-MM-DD"
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            value={form.deadline} 
            onChangeText={text => setForm({ ...form, deadline: text })}
            editable={!loading}
        />
      </View>

      {/* Receipt */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Receipt <Text style={styles.labelOptional}>(Optional)</Text></Text>
        <TouchableOpacity 
            onPress={handleNativeFileUpload} 
            style={styles.fileButton}
            disabled={loading}
        >
            <Text style={styles.fileButtonText}>
                {file ? `File Selected: ${file.name}` : "Tap to Select Receipt/File"}
            </Text>
            {file && (
                <TouchableOpacity onPress={() => setFile(null)} style={styles.fileClearButton}>
                    <Text style={styles.fileClearText}>✕</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
        {file && <Text style={styles.fileNameText}>Selected: {file.name}</Text>}
      </View>

      <TouchableOpacity 
        onPress={submit} 
        disabled={loading || otherMembers.length === 0 || !form.debtorId || !form.amount} 
        style={[
            styles.submitButton, 
            (loading || otherMembers.length === 0 || !form.debtorId || !form.amount) && styles.disabledButton
        ]}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Confirm & Lend</Text>}
      </TouchableOpacity>
    </View>
  );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: {
        gap: 16, // space-y-4
        padding: 16, // Simulating widget padding
    },
    formGroup: {
        gap: 4, // mb-1 spacing from label
    },
    label: {
        fontSize: 14, // text-sm
        fontWeight: 'bold',
        color: '#374151', // text-gray-700
    },
    labelOptional: {
        color: '#9CA3AF', // text-gray-400
        fontWeight: 'normal',
    },
    textInput: {
        width: '100%',
        padding: 12, // p-3
        borderWidth: 1,
        borderColor: '#D1D5DB', // border-gray-300
        borderRadius: 8, // rounded-lg
        backgroundColor: 'white',
        color: '#334155', // text-slate-700
        fontSize: 16,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#D1D5DB', 
        borderRadius: 8,
        backgroundColor: 'white',
        overflow: 'hidden', // Ensures border radius works on Android
    },
    picker: {
        width: '100%',
        height: 44, // standard height for RN inputs
    },
    amountGroup: {
        flexDirection: 'row',
        gap: 16, // grid grid-cols-2 gap-4
    },
    amountInputWrapper: {
        flex: 1,
        gap: 4,
    },
    amountInput: {
        fontSize: 18,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },

    // File Upload (Simulated)
    fileButton: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB', 
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fileButtonText: {
        fontSize: 14,
        color: '#64748B',
        flexShrink: 1,
    },
    fileClearButton: {
        padding: 4,
        borderRadius: 10,
        backgroundColor: '#E5E7EB',
        marginLeft: 8,
    },
    fileClearText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4B5563',
    },
    fileNameText: {
        fontSize: 12,
        color: '#4F46E5',
        marginTop: 4,
        paddingHorizontal: 4,
    },

    // Submit Button
    submitButton: {
        width: '100%',
        paddingVertical: 12, // py-3
        backgroundColor: '#4F46E5', // bg-indigo-600
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5, // shadow-lg shadow-indigo-200
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.5,
    },
});