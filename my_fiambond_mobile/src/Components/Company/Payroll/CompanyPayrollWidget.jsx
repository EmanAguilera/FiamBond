// CompanyPayrollWidget.jsx
import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert 
} from 'react-native';
import { AppContext } from '../../../Context/AppContext.jsx';

export default function CompanyPayrollWidget({ company, members = [], onSuccess }) {
    const { user } = useContext(AppContext);

    const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev/api'; // ← Change to your real backend IP/port when testing on real device

    const [activeTab, setActiveTab] = useState('salary');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        employeeId: '',
        amount: '',
        notes: ''
    });

    const handleInputChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
        setError(null);
    };

    const handleSubmit = async () => {
        if (!formData.employeeId) {
            setError("Please select an employee.");
            return;
        }
        if (!formData.amount) {
            setError("Please enter an amount.");
            return;
        }

        setLoading(true);
        setError(null);

        const employee = members.find(m => m.id === formData.employeeId);
        const typeLabel = activeTab === 'salary' ? 'Salary Payment' : 'Cash Advance';
        
        try {
            const transactionPayload = {
                user_id: user?.uid, 
                company_id: company?.id,
                type: 'expense', 
                amount: Number(formData.amount),
                description: `${typeLabel} for ${employee?.full_name || 'Employee'} - ${formData.notes}`,
                category: activeTab === 'salary' ? 'Payroll' : 'Cash Advance',
                date: new Date().toISOString()
            };

            const response = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionPayload)
            });

            if (!response.ok) {
                throw new Error("Failed to process payroll transaction.");
            }

            Alert.alert("Success", `${typeLabel} recorded successfully.`);
            
            if (onSuccess) onSuccess();
            
            // Reset form
            setFormData({ employeeId: '', amount: '', notes: '' });

        } catch (err) {
            console.error(err);
            setError("Failed to record transaction. Check connection.");
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = "text-sm font-bold text-slate-700 mb-2";
    const inputStyle = "w-full p-4 border border-slate-200 rounded-2xl bg-white text-slate-800 text-base mb-5";

    return (
        <ScrollView className="flex-1 p-1" keyboardShouldPersistTaps="handled">
            
            {/* TABS */}
            <View className="flex-row bg-slate-100 p-1 rounded-2xl mb-6">
                <TouchableOpacity 
                    onPress={() => setActiveTab('salary')} 
                    className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'salary' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`text-xs font-bold ${activeTab === 'salary' ? 'text-indigo-600' : 'text-slate-500'}`}>
                        Run Salary
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('advance')} 
                    className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'advance' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`text-xs font-bold ${activeTab === 'advance' ? 'text-indigo-600' : 'text-slate-500'}`}>
                        Cash Advance
                    </Text>
                </TouchableOpacity>
            </View>

            {/* EMPLOYEE SELECTOR */}
            <Text className={labelStyle}>Select Employee</Text>
            <View className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-5">
                {members.length > 0 ? (
                    members.map((m) => (
                        <TouchableOpacity 
                            key={m.id}
                            onPress={() => handleInputChange('employeeId', m.id)}
                            className={`p-4 border-b border-slate-50 flex-row justify-between items-center ${formData.employeeId === m.id ? 'bg-indigo-50' : ''}`}
                        >
                            <Text className={`font-semibold ${formData.employeeId === m.id ? 'text-indigo-600' : 'text-slate-600'}`}>
                                {m.full_name}
                            </Text>
                            {formData.employeeId === m.id && (
                                <View className="bg-indigo-600 w-4 h-4 rounded-full items-center justify-center">
                                    <Text className="text-white text-[10px]">✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text className="p-4 text-slate-400 italic">No employees onboarded.</Text>
                )}
            </View>

            {/* AMOUNT INPUT */}
            <View>
                <Text className={labelStyle}>
                    {activeTab === 'salary' ? 'Net Salary Amount (₱)' : 'Advance Amount (₱)'}
                </Text>
                <TextInput 
                    value={formData.amount} 
                    onChangeText={(val) => handleInputChange('amount', val)} 
                    keyboardType="numeric"
                    placeholder="0.00"
                    editable={!loading}
                    className={inputStyle}
                />
            </View>

            {/* NOTES INPUT */}
            <View>
                <Text className={labelStyle}>Notes / Period</Text>
                <TextInput 
                    value={formData.notes} 
                    onChangeText={(val) => handleInputChange('notes', val)} 
                    placeholder={activeTab === 'salary' ? "e.g., Sept 15-30" : "e.g., Emergency fund"} 
                    placeholderTextColor="#94a3b8"
                    editable={!loading}
                    className={inputStyle}
                />
            </View>

            {/* CONTEXT CARDS */}
            {activeTab === 'salary' ? (
                <View className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6">
                    <Text className="text-[10px] text-blue-700 leading-4 font-medium italic text-center">
                        This records a payroll expense in the company ledger.
                    </Text>
                </View>
            ) : (
                <View className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-6">
                    <Text className="text-[10px] text-amber-700 leading-4 font-medium italic text-center">
                        Recorded as a corporate expense. Ensure you have a repayment agreement.
                    </Text>
                </View>
            )}

            {error && (
                <View className="bg-rose-50 p-3 rounded-xl mb-4">
                    <Text className="text-rose-600 text-xs text-center font-bold">{error}</Text>
                </View>
            )}

            {/* SUBMIT BUTTON */}
            <TouchableOpacity 
                onPress={handleSubmit} 
                disabled={loading}
                activeOpacity={0.8}
                className={`w-full py-5 rounded-2xl shadow-lg items-center mb-10 ${
                    loading ? 'bg-slate-300' : activeTab === 'salary' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-indigo-600 shadow-indigo-100'
                }`}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-bold text-lg">
                        {activeTab === 'salary' ? 'Disburse Salary' : 'Grant Advance'}
                    </Text>
                )}
            </TouchableOpacity>

            <View className="h-10" />
        </ScrollView>
    );
}