import React from "react";
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from 'react-native-vector-icons/Ionicons'; 
// Note: window.scrollTo and Helmet are removed as they are web-specific

// --- ICON (Back Arrow for Navigation) ---
const BackIcon = () => (
    <Ionicons name="arrow-back-outline" size={20} className="mr-2" />
);

export default function TermsOfServiceNative() {
    const navigation = useNavigation();

    return (
        <ScrollView 
            className="flex-1 bg-gray-50 font-sans text-gray-900"
            contentContainerStyle={{ paddingVertical: 48, paddingHorizontal: 16 }} // py-12 px-4 sm:px-6 lg:px-8
        >
            <View className="max-w-4xl mx-auto w-full">
                
                {/* Back Button */}
                <View className="mb-8">
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        className="inline-flex flex-row items-center text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                    >
                        <BackIcon />
                        <Text className="text-indigo-600 font-semibold">Back to Home</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Content Card */}
                <View className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
                    <View className="border-b border-gray-100 pb-8 mb-8">
                        <Text className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Terms of Service</Text>
                        <Text className="text-gray-500 text-sm font-medium uppercase tracking-wider">Last Updated: November 27, 2025</Text>
                    </View>

                    <View className="space-y-8 text-gray-600 leading-relaxed">
                        
                        <View>
                            <Text className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</Text>
                            <Text className="text-gray-600">
                                By creating an account or accessing FiamBond ("The Service"), you agree to be bound by these Terms. 
                                If you do not agree, you may not use the Service. FiamBond is a digital ledger application designed 
                                for tracking financial records; it is <Text className="font-bold">not</Text> a bank, wallet, or financial institution.
                            </Text>
                        </View>

                        <View>
                            <Text className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</Text>
                            <Text className="mb-3 text-gray-600">
                                FiamBond provides a platform for tracking loans, debts, and payroll through three distinct "Realms":
                            </Text>
                            
                            {/* List structure conversion */}
                            <View className="pl-6 space-y-2">
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">
                                        <Text className="font-bold">Personal Realm:</Text> For individual tracking and smart loans between friends.
                                    </Text>
                                </View>
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">
                                        <Text className="font-bold">Family Realm:</Text> Shared tracking for household expenses and budgets.
                                    </Text>
                                </View>
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">
                                        <Text className="font-bold">Company Realm:</Text> Professional suite for employee cash advances and payroll generation.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View>
                            <Text className="text-xl font-bold text-gray-900 mb-3">3. User Responsibilities</Text>
                            <Text className="text-gray-600">
                                You are solely responsible for the accuracy of the data you input. FiamBond acts as a calculator and storage 
                                system for the data you provide ("The Ledger of Truth"). We do not verify the legality or reality of 
                                the debts recorded. You agree not to use the platform for money laundering or illegal activities.
                            </Text>
                        </View>

                        <View>
                            <Text className="text-xl font-bold text-gray-900 mb-3">4. Subscriptions & Payments</Text>
                            <Text className="mb-3 text-gray-600">
                                Access to "Company Realm" features requires a paid subscription (Monthly or Annual).
                            </Text>
                            
                            <View className="pl-6 space-y-2">
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">
                                        <Text className="font-bold">Billing Cycle:</Text> Fees are billed in advance on a recurring basis.
                                    </Text>
                                </View>
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">
                                        <Text className="font-bold">Cancellations:</Text> You may cancel at any time. Your access will continue until the end of the current billing period.
                                    </Text>
                                </View>
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">
                                        <Text className="font-bold">Refunds:</Text> Refunds are handled on a case-by-case basis within 7 days of payment.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View>
                            <Text className="text-xl font-bold text-gray-900 mb-3">5. Disclaimer of Liability</Text>
                            <Text className="text-gray-600">
                                FiamBond is provided "AS IS". We are not liable for any disputes arising between users regarding 
                                debts recorded on the platform. The "Payslips" generated by the system are for record-keeping purposes 
                                and rely entirely on user input.
                            </Text>
                        </View>

                        <View>
                            <Text className="text-xl font-bold text-gray-900 mb-3">6. Termination</Text>
                            <Text className="text-gray-600">
                                We reserve the right to suspend or terminate accounts that violate these terms, including but not limited 
                                to fraudulent use or harassment of other users via the loan request system.
                            </Text>
                        </View>

                    </View>
                </View>
            </View>
        </ScrollView>
    );
}