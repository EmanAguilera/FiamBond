import React, { useState, useContext } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    Modal,
    Platform 
} from "react-native";
import { AppContext } from "../../../Context/AppContext"; 

// Cloudinary constants (use process.env in RN/Expo)
const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const API_URL = 'http://localhost:3000/api'; // Simplified URL

// Define the structure of the user object retrieved from context
interface User { 
    uid: string; 
    [key: string]: any; 
}
// Define the structure of the context itself (assuming it provides a nullable user)
interface AppContextType { 
    user: User | null; 
    [key: string]: any; 
}

interface Props { 
    company: { id: string | number }; 
    onSuccess?: () => void; 
}

interface NativeFile {
    uri: string;
    name: string;
    type: string; 
}

export default function CreateCompanyTransactionWidget({ company, onSuccess }: Props) {
    // FIX: Assert the context type with non-null assertion.
    const { user } = useContext(AppContext)! as AppContextType; 
    
    const [form, setForm] = useState({ desc: "", amt: "", type: "expense" as "income" | "expense" });
    const [file, setFile] = useState<NativeFile | null>(null);
    const [loading, setLoading] = useState(false);
    const [conflict, setConflict] = useState<{ name: string } | null>(null);

    // Placeholder for native file picker
    const handleNativeFileUpload = async () => {
        Alert.alert("File Picker", "Native file picker integration required.");
    };

    const submit = async (ignoreConflict: boolean = false) => {
        // FIX: The compiler now knows user is of type User | null. The check narrows the type to User.
        if (!user || !user.uid) return Alert.alert("Error", "Login required");
        
        setLoading(true);
        setConflict(null);

        try {
            let attachment_url = null;
            if (file) {
                const fd = new FormData();
                
                fd.append('file', {
                    uri: file.uri,
                    name: file.name,
                    type: file.type,
                } as any); 

                fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const res = await fetch(CLOUD_URL, { 
                    method: 'POST', 
                    body: fd,
                    headers: {}, 
                });
                
                if (res.ok) attachment_url = (await res.json()).secure_url;
                else console.warn("Cloudinary upload failed for company transaction.");
            }

            const res = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid, // SAFE access now (Error 2339 fixed)
                    company_id: company.id, 
                    description: form.desc,
                    amount: parseFloat(form.amt), 
                    type: form.type, 
                    attachment_url,
                    created_at: new Date().toISOString()
                })
            });

            if (res.status === 409 && !ignoreConflict) {
                 setConflict({ name: form.desc || 'Transaction' });
                 setLoading(false); 
                 return;
            }

            if (!res.ok) throw new Error("Failed to save record");
            Alert.alert("Success", `${form.type === 'income' ? 'Revenue' : 'Expense'} Recorded`);
            setForm({ desc: "", amt: "", type: "expense" });
            setFile(null); 
            setConflict(null);
            onSuccess?.();
        } catch (e: any) { 
            console.error(e);
            Alert.alert("Error", e.message || "Error saving record"); 
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            {/* CONFLICT MODAL */}
            <Modal 
                visible={!!conflict} 
                transparent={true} 
                animationType="fade"
                onRequestClose={() => setConflict(null)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Conflict: 
                            <Text style={styles.modalTitleConflict}>{conflict?.name}</Text>
                        </Text>
                        <Text style={styles.modalMessage}>A record with a similar description may already exist. What would you like to do?</Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity onPress={() => setConflict(null)} style={[styles.modalButton, styles.modalButtonRose]}>
                                <Text style={styles.modalButtonRoseText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => submit(true)} style={[styles.modalButton, styles.modalButtonIndigo]}>
                                <Text style={styles.modalButtonIndigoText}>Proceed Anyway</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.formSection}>
                <View style={styles.typeButtonGrid}>
                    <TouchableOpacity onPress={() => setForm({ ...form, type: 'income' })}
                        style={[styles.typeButton, form.type === 'income' && styles.incomeButtonActive]} disabled={loading}>
                        <Text style={[styles.typeButtonText, form.type === 'income' ? styles.incomeButtonTextActive : styles.buttonTextInactive]}>
                            + Revenue
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setForm({ ...form, type: 'expense' })}
                        style={[styles.typeButton, form.type === 'expense' && styles.expenseButtonActive]} disabled={loading}>
                        <Text style={[styles.typeButtonText, form.type === 'expense' ? styles.expenseButtonTextActive : styles.buttonTextInactive]}>
                            - Expense
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Amount (₱)</Text>
                    <TextInput 
                        style={styles.amountInput}
                        keyboardType="numeric"
                        placeholder="0.00"
                        value={form.amt}
                        onChangeText={text => setForm({ ...form, amt: text.replace(/[^0-9.]/g, '') })} 
                        editable={!loading}
                    />
                </View>
                
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput 
                        style={styles.textInput}
                        placeholder={form.type === 'income' ? "e.g. Sales" : "e.g. Office Rent"} 
                        value={form.desc}
                        onChangeText={text => setForm({ ...form, desc: text })}
                        editable={!loading}
                    />
                </View>
                
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Receipt <Text style={styles.labelOptional}>(Optional)</Text></Text>
                    
                    {/* Native File Upload Button */}
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
                    onPress={() => submit(false)} 
                    disabled={loading || !form.amt || !form.desc} 
                    style={[styles.submitButton, (loading || !form.amt || !form.desc) && styles.disabledButton]}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Save Record</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: 'white' },
    formSection: { gap: 16 }, 
    typeButtonGrid: { flexDirection: 'row', gap: 16 },
    typeButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    typeButtonText: { fontWeight: 'bold', fontSize: 16 },
    incomeButtonActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
    incomeButtonTextActive: { color: '#047857' },
    expenseButtonActive: { backgroundColor: '#FFF1F2', borderColor: '#F43F5E' },
    expenseButtonTextActive: { color: '#BE123C' },
    buttonTextInactive: { color: '#64748B' },
    formGroup: { gap: 4 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
    labelOptional: { color: '#9CA3AF', fontWeight: 'normal' },
    textInput: { width: '100%', padding: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, fontSize: 16, color: '#1F2937' },
    amountInput: {
        width: '100%', padding: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, fontSize: 18, color: '#1F2937',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', 
    },
    fileButton: {
        padding: 10, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: '#F9FAFB',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    fileButtonText: { fontSize: 14, color: '#64748B', flexShrink: 1 },
    fileNameText: { fontSize: 12, color: '#4F46E5', marginTop: 4, paddingHorizontal: 4 },
    fileClearButton: { padding: 4, borderRadius: 10, backgroundColor: '#E5E7EB', marginLeft: 8 },
    fileClearText: { fontSize: 12, fontWeight: 'bold', color: '#4B5563' },
    submitButton: {
        width: '100%', paddingVertical: 12, backgroundColor: '#4F46E5', borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
    },
    submitButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    disabledButton: { opacity: 0.5 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modalCard: {
        backgroundColor: 'white', padding: 24, borderRadius: 12, textAlign: 'center', maxWidth: 400, width: '100%',
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.37, shadowRadius: 7.49, elevation: 12,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#1F2937' },
    modalTitleConflict: { color: '#4F46E5' },
    modalMessage: { fontSize: 14, color: '#4B5563', marginBottom: 16, textAlign: 'center' },
    modalButtonContainer: { flexDirection: 'row', gap: 12 },
    modalButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    modalButtonRose: { backgroundColor: '#FFF1F2' },
    modalButtonRoseText: { color: '#BE123C', fontWeight: 'bold' },
    modalButtonIndigo: { backgroundColor: '#4F46E5' },
    modalButtonIndigoText: { color: 'white', fontWeight: 'bold' },
});