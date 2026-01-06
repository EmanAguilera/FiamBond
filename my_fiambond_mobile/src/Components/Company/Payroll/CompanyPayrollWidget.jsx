import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    StyleSheet, 
    Alert, 
    ActivityIndicator 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AppContext } from '../../../Context/AppContext.jsx';

// TypeScript interfaces are removed here

export default function CompanyPayrollWidget({ company, members, onSuccess }) {
    // NOTE: If user is guaranteed not null, remove the safety check. 
    // Otherwise, ensure AppContext is correctly set up.
    const { user } = useContext(AppContext);
    const API_URL = 'http://localhost:3000/api'; // Simplified URL

    const [activeTab, setActiveTab] = useState('salary'); // 'salary' or 'advance'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // Type annotation removed

    const [formData, setFormData] = useState({
        employeeId: '',
        amount: '',
        notes: ''
    });

    // Type annotation removed
    const handleInputChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async () => {
        // CONTEXT NULL CHECK (Essential for runtime safety and to avoid the theoretical TS error)
        if (!user || !user.uid) return Alert.alert("Error", "Login required.");
        if (loading) return;

        setLoading(true);
        setError(null);

        if (!formData.employeeId) {
            setError("Please select an employee.");
            setLoading(false);
            return;
        }
        if (Number(formData.amount) <= 0 || isNaN(Number(formData.amount))) {
             setError("Please enter a valid amount.");
            setLoading(false);
            return;
        }

        const employee = members.find(m => m.id === formData.employeeId);
        const typeLabel = activeTab === 'salary' ? 'Salary Payment' : 'Cash Advance';
        
        try {
            const transactionPayload = {
                user_id: user.uid, // Recorded by Admin
                company_id: company.id,
                type: 'expense', // Both are expenses for the company
                amount: Number(formData.amount),
                description: `${typeLabel} for ${employee?.full_name || 'Employee'} - ${formData.notes}`,
                category: activeTab === 'salary' ? 'Payroll' : 'Cash Advance',
                date: new Date()
            };

            const response = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionPayload)
            });

            if (!response.ok) throw new Error("Failed to process payroll transaction.");

            if (onSuccess) onSuccess();
            setFormData({ employeeId: '', amount: '', notes: '' });
            Alert.alert("Success", `${typeLabel} recorded successfully.`);

        } catch (err) {
            console.error(err);
            setError("Failed to record transaction.");
            Alert.alert("Error", "Failed to record transaction.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    onPress={() => setActiveTab('salary')} 
                    style={[styles.tabButton, activeTab === 'salary' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'salary' ? styles.tabTextActive : styles.tabTextInactive]}>
                        Run Salary
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('advance')} 
                    style={[styles.tabButton, activeTab === 'advance' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'advance' ? styles.tabTextActive : styles.tabTextInactive]}>
                        Cash Advance
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Select Employee</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={formData.employeeId}
                            // Type assertion removed
                            onValueChange={(itemValue) => handleInputChange('employeeId', itemValue)}
                            style={styles.picker}
                            enabled={!loading}
                        >
                            <Picker.Item label="-- Choose Employee --" value="" enabled={false} />
                            {members.map(m => (
                                <Picker.Item key={m.id} label={m.full_name} value={m.id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        {activeTab === 'salary' ? 'Net Salary Amount (₱)' : 'Advance Amount (₱)'}
                    </Text>
                    <TextInput 
                        style={styles.textInput} 
                        keyboardType="numeric"
                        value={formData.amount} 
                        // The 'required' and 'min' props were removed in a previous step's logic
                        onChangeText={(text) => handleInputChange('amount', text.replace(/[^0-9.]/g, ''))} 
                        editable={!loading}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Notes / Period</Text>
                    <TextInput 
                        style={styles.textInput}
                        value={formData.notes} 
                        onChangeText={(text) => handleInputChange('notes', text)} 
                        placeholder={activeTab === 'salary' ? "e.g., September 15-30" : "e.g., Emergency fund"} 
                        editable={!loading}
                    />
                </View>

                {activeTab === 'salary' && (
                    <View style={styles.salaryInfoBox}>
                        <Text style={styles.salaryInfoText}>
                            This will generate a payroll expense in the company ledger and can be exported as a PDF invoice later.
                        </Text>
                    </View>
                )}
                {activeTab === 'advance' && (
                    <View style={styles.advanceInfoBox}>
                        <Text style={styles.advanceInfoText}>
                            This will be recorded as a company expense. Ensure you have an agreement for repayment.
                        </Text>
                    </View>
                )}

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity 
                    onPress={handleSubmit} 
                    disabled={loading || !formData.employeeId || !formData.amount}
                    style={[
                        styles.submitButton, 
                        (loading || !formData.employeeId || !formData.amount) && styles.disabledButton,
                        activeTab === 'salary' ? styles.submitButtonSalary : styles.submitButtonAdvance,
                    ]}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>{activeTab === 'salary' ? 'Disburse Salary' : 'Grant Advance'}</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: {
        gap: 16, // space-y-4
        padding: 16,
    },
    
    // Tabs
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#E5E7EB', // border-gray-200
        marginBottom: 8,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8, // py-2
        borderBottomWidth: 2,
        borderColor: 'transparent',
    },
    tabButtonActive: {
        borderColor: '#4F46E5', // border-indigo-600
    },
    tabText: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
        textAlign: 'center',
    },
    tabTextActive: {
        color: '#4F46E5', // text-indigo-600
    },
    tabTextInactive: {
        color: '#6B7280', // text-gray-500
    },

    // Form
    formSection: { gap: 16 }, // space-y-4 pt-2
    formGroup: { marginBottom: 8 },
    label: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
        color: '#374151', // text-gray-700
        marginBottom: 4, // mb-1
    },
    textInput: {
        width: '100%',
        padding: 8, // p-2
        borderWidth: 1,
        borderColor: '#D1D5DB', // border-gray-300
        borderRadius: 8, // rounded-lg
        fontSize: 16,
        color: '#1F2937',
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#D1D5DB', 
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    picker: {
        width: '100%',
        height: 44, // standard height for RN inputs
    },

    // Info Boxes
    salaryInfoBox: {
        backgroundColor: '#EFF6FF', // bg-blue-50
        padding: 12, // p-3
        borderRadius: 6, // rounded-md
    },
    salaryInfoText: {
        fontSize: 12, // text-xs
        color: '#1E40AF', // text-blue-700
    },
    advanceInfoBox: {
        backgroundColor: '#FFFBEB', // bg-amber-50
        padding: 12,
        borderRadius: 6,
    },
    advanceInfoText: {
        fontSize: 12,
        color: '#92400E', // text-amber-700
    },
    
    // Submit Button
    errorText: {
        color: '#EF4444', // text-red-500
        fontSize: 14,
        marginBottom: 8,
    },
    submitButton: {
        width: '100%', // w-full
        paddingVertical: 10, // py-2.5
        borderRadius: 12, // rounded-xl
        fontWeight: 'bold',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4, // shadow-md
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonSalary: {
        backgroundColor: '#059669', // bg-emerald-600
    },
    submitButtonAdvance: {
        backgroundColor: '#4F46E5', // bg-indigo-600
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