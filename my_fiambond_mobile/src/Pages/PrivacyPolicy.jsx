import React, { useEffect } from "react";
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from 'react-native-vector-icons/Ionicons'; 
// Note: In RN, we don't need Helmet or window.scrollTo

// --- ICON (Back Arrow for Navigation) ---
const BackIcon = () => (
    <Ionicons name="arrow-back-outline" size={20} className="mr-2" />
);

export default function PrivacyPolicyNative() {
    const navigation = useNavigation();

    // In React Native, the ScrollView manages scrolling, and navigation stack
    // ensures the component is at the "top" of the view hierarchy.
    // The web useEffect (window.scrollTo) is unnecessary here.

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
                        <Text className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</Text>
                        <Text className="text-gray-500 text-sm font-medium uppercase tracking-wider">Effective Date: November 27, 2025</Text>
                    </View>

                    <View className="space-y-8 text-gray-600 leading-relaxed">
                        
                        <View>
                            <Text className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</Text>
                            <Text className="mb-3">To operate the Ledger of Truth, we collect the following types of information:</Text>
                            
                            {/* List structure conversion (RN lists often require custom styling) */}
                            <View className="pl-6 space-y-2">
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">
                                        <Text className="font-bold">Account Information:</Text> Name, email address, and encrypted password.
                                    </Text>
                                </View>
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">
                                        <Text className="font-bold">Financial Data:</Text> Transaction amounts, dates, notes, and loan statuses inputted by you.
                                    </Text>
                                </View>
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">
                                        <Text className="font-bold">Realm Associations:</Text> Connections to Family or Company realms (employee lists, payroll records).
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View>
                            <Text className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Data</Text>
                            <Text>We use your data solely to provide the Service functionality:</Text>
                            
                            <View className="pl-6 space-y-2 mt-2">
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">Calculating balances and debt totals.</Text>
                                </View>
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">Generating PDF payslips and invoices.</Text>
                                </View>
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">Sending notifications for loan requests or updates.</Text>
                                </View>
                                <View className="flex-row">
                                    <Text className="text-gray-600 pr-2">•</Text>
                                    <Text className="text-gray-600">
                                        We <Text className="font-bold">never</Text> sell your personal financial data to third-party advertisers.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View>
                            <Text className="text-xl font-bold text-gray-900 mb-3">3. Data Security</Text>
                            <Text className="text-gray-600">
                                Security is our top priority. We use industry-standard <Text className="font-bold">AES-256 encryption</Text> for sensitive data 
                                stored in our database. While we strive to protect your personal information, no method of transmission 
                                over the Internet is 100% secure.
                            </Text>
                        </View>

                        <View>
                            <Text className="text-xl font-bold text-gray-900 mb-3">4. Data Sharing</Text>
                            <Text className="text-gray-600">
                                Data entered into a <Text className="font-bold">Shared Realm</Text> (Family or Company) is visible to other members of that Realm 
                                based on their permission levels (Admin, Member, Viewer). You accept that invited members can view the 
                                transactions associated with that Realm.
                            </Text>
                        </View>

                        <View>
                            <Text className="text-xl font-bold text-gray-900 mb-3">5. Your Rights</Text>
                            <Text className="text-gray-600">
                                You have the right to request an export of your data or the deletion of your account. Deleting your account 
                                will permanently remove your personal access to the ledger, though transaction records involving other 
                                users may persist in their history to maintain ledger integrity.
                            </Text>
                        </View>

                        <View>
                            <Text className="text-xl font-bold text-gray-900 mb-3">6. Contact Us</Text>
                            <Text className="text-gray-600">
                                If you have questions about this Privacy Policy, please contact us at <Text className="text-indigo-600 font-medium">support@fiambond.web.app</Text>.
                            </Text>
                        </View>

                    </View>
                </View>
            </View>
        </ScrollView>
    );
}