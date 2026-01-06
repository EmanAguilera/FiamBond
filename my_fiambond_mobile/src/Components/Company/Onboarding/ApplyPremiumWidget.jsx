import React, { useState, useContext, useRef } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput, 
    ActivityIndicator, 
    Alert, 
    Platform // <--- FIX: Platform must be imported from 'react-native'
} from "react-native";
// NOTE: Tesseract.js is a web library and must be replaced with a native solution (e.g., react-native-tesseract-ocr or a cloud service).
// For this conversion, the function signature is kept, but the implementation is a placeholder.
// import Tesseract from 'tesseract.js'; 
import { AppContext } from "../../../Context/AppContext"; 

// --- STYLESHEET (CONVERSION FROM TAILWIND) ---
const commonStyles = StyleSheet.create({
    textCenter: { textAlign: 'center' },
    p6: { padding: 24 },
    mxAuto: { marginHorizontal: 'auto' },
    bgWhite: { backgroundColor: 'white' },
    roundedXl: { borderRadius: 12 },
    flex: { flexDirection: 'row' },
    itemsCenter: { alignItems: 'center' },
    justifyCenter: { justifyContent: 'center' },
    shadowLg: { 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 3.84, 
        elevation: 5 
    },
    fontBold: { fontWeight: 'bold' },
    mb4: { marginBottom: 16 },
    mb6: { marginBottom: 24 },
    mb3: { marginBottom: 12 },
    mt3: { marginTop: 12 },
    p5: { padding: 20 },
    wFull: { width: '100%' },
    py3: { paddingVertical: 12 },
    py2: { paddingVertical: 8 },
    p1: { padding: 4 },
    roundedLg: { borderRadius: 8 },
    roundedMd: { borderRadius: 6 },
    textSm: { fontSize: 14 },
    textXs: { fontSize: 12 },
    textGray400: { color: '#9CA3AF' },
    textGray600: { color: '#4B5563' },
    textGray700: { color: '#374151' },
    textGray800: { color: '#1F2937' },
    textGray900: { color: '#111827' },
    textBlue800: { color: '#1E40AF' },
    bgBlue100: { backgroundColor: '#DBEAFE' },
    uppercase: { textTransform: 'uppercase' },
    trackingWider: { letterSpacing: 1.5 },
    borderDashed: { borderStyle: 'dashed' },
    border2: { borderWidth: 2 },
    borderGray300: { borderColor: '#D1D5DB' },
    bgGray50: { backgroundColor: '#F9FAFB' },
    textLg: { fontSize: 18 },
    trackingWidest: { letterSpacing: 3 },
    fontMono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }, // approximation
});

// --- UPDATED: ONLY GCASH PROVIDER ---
const PAYMENT_PROVIDERS = {
    gcash: {
        id: 'gcash',
        label: 'GCash',
        color: '#2563EB', // bg-blue-600
        text: '#2563EB', // text-blue-600
        bgLight: '#EFF6FF', // bg-blue-50
        number: '0917-123-4567',
        accountName: 'Eman Ryan L. Aguilera'
    }
};

// --- UPDATED: New Price Tiers ---
const prices = {
    monthly: { 
        family: { amount: 500, label: "₱500" },      // Basic premium for family access
        company: { amount: 1500, label: "₱1,500" }   // Full premium for company access
    },
    yearly:  { 
        family: { amount: 5000, label: "₱5,000" },   // Basic yearly
        company: { amount: 15000, label: "₱15,000" } // Full yearly
    }
};

// --- RENAMED COMPONENT AND ADDED targetAccess PROP ---
export default function ApplyPremiumWidget({ onClose, onUpgradeSuccess, targetAccess = 'company' }) {
    const { user } = useContext(AppContext);
    
    const [step, setStep] = useState(1);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [isScanning, setIsScanning] = useState(false);
    const [refNumber, setRefNumber] = useState('');
    // NOTE: In React Native, useRef is not typically used for file selection. 
    // It's kept here as a conceptual placeholder for triggering a native action.
    const fileInputRef = useRef(null); 

    const selectedProviderKey = 'gcash'; 
    const selectedPlan = prices[billingCycle][targetAccess]; 
    const activeProvider = PAYMENT_PROVIDERS[selectedProviderKey];
    
    // UI Labels
    const accessHeader = targetAccess === 'family' ? 'Premium Family Access' : 'Full Company Access';
    const getAccessLabel = () => targetAccess === 'family' ? 'Family Access' : 'Company Access'; // Helper for repeated use

    // --- AI SCANNING (React Native Placeholder) ---
    // This function must be implemented using native modules (e.g., react-native-image-picker + a native OCR library).
    const handleFileUpload = async () => {
        // 1. Trigger native image picker (e.g., using Expo ImagePicker or react-native-image-picker)
        // 2. Get the file URI/path.
        // 3. Start scanning.
        
        setIsScanning(true);
        setRefNumber(''); // Clear ref number while scanning

        try {
            // Placeholder: Simulate a file pick and OCR recognition
            console.log("Starting native file pick and OCR simulation...");
            await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate loading
            
            // Placeholder OCR Result
            const simulatedText = "Transaction successful. Reference Number: 100554223. Amount: 1500. Date: 2025-01-01.";
            
            processScannedText(simulatedText);
        } catch (err) {
            console.error(err);
            Alert.alert("OCR Error", "Could not read image. Please type manually.");
        } finally {
            setIsScanning(false);
        }
    };

    const processScannedText = (text) => {
        const cleanText = text.toUpperCase();
        // Regex to match a sequence of 8 to 13 digits (common ref number length)
        const refMatch = cleanText.match(/(\d{8,13})/); 
        
        if (refMatch) {
            setRefNumber(refMatch[1]);
        } else {
            Alert.alert("OCR Result", "Reference number not clearly detected. Please double check.");
        }
    };

    // --- SUBMIT ---
    const handleSubmit = () => {
        if(!refNumber) return Alert.alert("Error", "Please enter the Reference Number.");
        
        const userIdToUse = user.uid || user.id; 

        if (!userIdToUse) {
            console.error("User ID is missing!", user);
            return Alert.alert("System Error", "User ID missing. Please re-login.");
        }

        onUpgradeSuccess({
            amountPaid: selectedPlan.amount,
            plan: billingCycle,
            paymentRef: refNumber,
            userId: userIdToUse, 
            method: activeProvider.label,
            targetAccess: targetAccess 
        });
    };

    // --- ICON PLACEHOLDERS ---
    // In a real app, use react-native-vector-icons or react-native-svg
    const CircleCheckIcon = ({ color }) => (
        <Text style={{ color, fontSize: 32 }}>✓</Text> // Simple text checkmark
    );
    const InfoIcon = ({ color }) => (
        <Text style={{ color, fontSize: 16 }}>ⓘ</Text> // Simple text info
    );
    const PhotoIcon = ({ color }) => (
        <Text style={{ color, fontSize: 30 }}>📸</Text> // Emoji or a simple box placeholder
    );

    return (
        <View style={[commonStyles.textCenter, commonStyles.p6, commonStyles.mxAuto, commonStyles.bgWhite, commonStyles.roundedXl, { width: '90%', maxWidth: 400 }]}>
            {/* ICON */}
            <View style={[styles.iconContainer, { backgroundColor: activeProvider.color }, commonStyles.shadowLg, commonStyles.mb4]}>
                <CircleCheckIcon color="white" />
            </View>
            
            {/* UPDATED HEADER */}
            <Text style={[styles.headerText, commonStyles.textGray800]}>{accessHeader}</Text>
            <View style={[commonStyles.flex, commonStyles.itemsCenter, commonStyles.justifyCenter, commonStyles.mb6]}>
                <View style={styles.pulseDot} />
                <Text style={styles.scannerStatusText}>AI Receipt Scanner Active</Text>
            </View>

            {/* STEP 1 */}
            {step === 1 && (
                <View style={styles.stepContainer}>
                    {/* Billing Cycle Selector */}
                    <View style={[styles.cycleSelector, commonStyles.mb6]}>
                        <TouchableOpacity 
                            onPress={() => setBillingCycle('monthly')} 
                            style={[styles.cycleButton, billingCycle === 'monthly' && styles.cycleButtonActive]}
                        >
                            <Text style={[styles.cycleButtonText, billingCycle === 'monthly' ? commonStyles.textGray800 : commonStyles.textGray600]}>Monthly</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setBillingCycle('yearly')} 
                            style={[styles.cycleButton, billingCycle === 'yearly' && styles.cycleButtonActive]}
                        >
                            <Text style={[styles.cycleButtonText, billingCycle === 'yearly' ? commonStyles.textGray800 : commonStyles.textGray600]}>Yearly ({targetAccess === 'company' ? '-20%' : '-16.6%'})</Text>
                        </TouchableOpacity>
                    </View>

                    {/* GCash Only Label */}
                    <View style={[commonStyles.textCenter, commonStyles.mb3, styles.gcashOnlyLabel]}>
                        <InfoIcon color={commonStyles.textBlue800.color} />
                        <Text style={[commonStyles.textSm, commonStyles.fontBold, commonStyles.textBlue800, { marginLeft: 8 }]}>
                            Pay via GCash Only
                        </Text>
                    </View>

                    {/* Payment Info Box */}
                    <View style={[styles.paymentInfoBox, { borderColor: activeProvider.text, backgroundColor: activeProvider.bgLight }, commonStyles.mb6]}>
                        <Text style={[commonStyles.textXs, commonStyles.textGray600, commonStyles.mb1]}>Send <Text style={[commonStyles.textGray900, commonStyles.fontBold]}>{selectedPlan.label}</Text> to:</Text>
                        <Text style={[styles.paymentNumberText, { color: activeProvider.text }]}>{activeProvider.number}</Text>
                        <Text style={[commonStyles.textXs, styles.accountNameText]}>{activeProvider.accountName}</Text>
                    </View>

                    {/* Next Button */}
                    <TouchableOpacity onPress={() => setStep(2)} style={[commonStyles.wFull, commonStyles.py3, commonStyles.roundedLg, commonStyles.fontBold, commonStyles.shadowLg, { backgroundColor: activeProvider.color }]}>
                        <Text style={styles.buttonTextWhite}>I have sent {selectedPlan.label} to GCash, Scan Receipt</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={onClose} style={commonStyles.mt3}>
                        <Text style={[commonStyles.textXs, commonStyles.textGray400, styles.hoverTextGray600]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* STEP 2 */}
            {step === 2 && (
                <View style={styles.stepContainer}>
                    {/* Upload Area */}
                    <TouchableOpacity 
                        onPress={isScanning ? null : handleFileUpload} // Use null for disabled on RN
                        activeOpacity={isScanning ? 1 : 0.7}
                        style={[
                            styles.uploadArea,
                            commonStyles.border2,
                            commonStyles.borderDashed,
                            commonStyles.roundedXl,
                            commonStyles.mb6,
                            isScanning ? styles.uploadAreaScanning : { borderColor: activeProvider.text, backgroundColor: activeProvider.bgLight }
                        ]}
                    >
                        {isScanning ? (
                            <View style={commonStyles.itemsCenter}>
                                <ActivityIndicator size="large" color="#4F46E5" style={commonStyles.mb3} />
                                <Text style={[commonStyles.textSm, commonStyles.fontBold, commonStyles.textGray600]}>Analyzing Receipt...</Text>
                            </View>
                        ) : (
                            <View style={commonStyles.itemsCenter}>
                                <PhotoIcon color={activeProvider.text} />
                                <Text style={[commonStyles.textSm, commonStyles.fontBold, commonStyles.textGray700]}>Tap to Upload Screenshot/Receipt</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Reference Number Input */}
                    <View style={[{ width: '100%', alignItems: 'flex-start' }, commonStyles.mb6]}>
                        <Text style={[commonStyles.textXs, commonStyles.fontBold, commonStyles.textGray500, commonStyles.uppercase, commonStyles.mb1]}>GCash Reference Number</Text>
                        <TextInput 
                            value={refNumber} 
                            onChangeText={setRefNumber} 
                            placeholder={isScanning ? "Scanning..." : "e.g. 100554223"}
                            keyboardType="numeric"
                            style={[
                                styles.textInput,
                                refNumber 
                                    ? styles.textInputActive
                                    : styles.textInputInactive
                            ]}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity 
                        onPress={handleSubmit} 
                        disabled={isScanning || !refNumber}
                        style={[
                            commonStyles.wFull, 
                            commonStyles.py3, 
                            commonStyles.roundedLg, 
                            commonStyles.fontBold, 
                            commonStyles.shadowLg,
                            styles.submitButton(isScanning || !refNumber, activeProvider.color)
                        ]}
                    >
                        <Text style={styles.buttonTextWhite}>Submit for Admin Verification & Unlock {getAccessLabel()}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => { setStep(1); setRefNumber(''); }} style={[commonStyles.wFull, commonStyles.mt3, commonStyles.py2]}>
                        <Text style={[commonStyles.textXs, commonStyles.textGray400, styles.hoverTextGray600, commonStyles.fontBold, commonStyles.textCenter]}>Back to Payment</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// --- REACT NATIVE STYLES ---
const styles = StyleSheet.create({
    // ...commonStyles will be merged here
    // Custom styles derived from Tailwind
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32, // w-16 h-16 rounded-full
        ...commonStyles.flex,
        ...commonStyles.itemsCenter,
        ...commonStyles.justifyCenter,
    },
    headerText: {
        fontSize: 20, // text-xl
        fontWeight: 'bold',
        marginBottom: 8,
    },
    pulseDot: {
        width: 8,
        height: 8,
        backgroundColor: '#10B981', // bg-green-500
        borderRadius: 4,
        marginRight: 8,
        // RN does not handle 'animate-pulse' easily.
    },
    scannerStatusText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    // Step 1
    stepContainer: {
        width: '100%',
        alignItems: 'center',
    },
    cycleSelector: {
        ...commonStyles.flex,
        backgroundColor: '#F3F4F6', // bg-gray-100
        borderRadius: 8,
        width: '100%',
        padding: 4,
    },
    cycleButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
        transitionDuration: 300,
    },
    cycleButtonActive: {
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    cycleButtonText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    gcashOnlyLabel: {
        ...commonStyles.flex,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(219, 234, 254, 0.7)', // bg-blue-100/70
    },
    paymentInfoBox: {
        borderWidth: 2,
        ...commonStyles.borderDashed,
        ...commonStyles.p5,
        ...commonStyles.roundedXl,
        width: '100%',
    },
    paymentNumberText: {
        fontSize: 24, // text-2xl
        fontWeight: 'bold',
        letterSpacing: -1, // tracking-tight
    },
    accountNameText: {
        color: '#6B7280', // text-gray-500
        marginTop: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    buttonTextWhite: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    hoverTextGray600: { // Placeholder for hover effect
        // In RN, use state for press effects instead of hover classes
    },
    // Step 2
    uploadArea: {
        padding: 32,
        width: '100%',
    },
    uploadAreaScanning: {
        borderColor: '#D1D5DB', // border-gray-300
        backgroundColor: '#F9FAFB', // bg-gray-50
    },
    textInput: {
        width: '100%',
        padding: 12, // p-3
        paddingLeft: 16, // pl-4
        borderWidth: 1,
        borderRadius: 8,
        // outlineStyle: 'none', // Removed, not supported in all RN
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Use Platform here
        ...commonStyles.textLg,
        ...commonStyles.trackingWidest,
        // transition-all is handled by conditional styles
    },
    textInputActive: {
        borderColor: '#10B981', // border-green-500
        backgroundColor: '#F0FFF4', // bg-green-50
        color: '#065F46', // text-green-800
    },
    textInputInactive: {
        borderColor: '#D1D5DB', // border-gray-300
        // focus:border-indigo-500 needs a focus state handler in RN
    },
    submitButton: (isDisabled, color) => ({
        backgroundColor: isDisabled ? '#D1D5DB' : color, // bg-gray-300 or active color
        // cursor: isDisabled ? 'not-allowed' : 'pointer', // web-only, but for context
        // hover:opacity-90 needs to be handled via activeOpacity/underlayColor
    }),
});