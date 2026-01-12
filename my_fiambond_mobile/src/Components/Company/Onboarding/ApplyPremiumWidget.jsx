// ApplyPremiumWidget.jsx
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { AppContext } from "../../../Context/AppContext";
import { CheckCircle2, Info, Upload, ArrowLeft } from "lucide-react-native";

// ── CONFIGURATION ────────────────────────────────────────────────
const PAYMENT_PROVIDERS = {
  gcash: {
    id: "gcash",
    label: "GCash",
    color: "bg-blue-600",
    text: "text-blue-600",
    border: "border-blue-600",
    bgLight: "bg-blue-50",
    number: "0917-123-4567",
    accountName: "Eman Ryan L. Aguilera",
  },
};

const prices = {
  monthly: {
    family: { amount: 500, label: "₱500" },
    company: { amount: 1500, label: "₱1,500" },
  },
  yearly: {
    family: { amount: 5000, label: "₱5,000" },
    company: { amount: 15000, label: "₱15,000" },
  },
};

export default function ApplyPremiumWidget({
  onClose,
  onUpgradeSuccess,
  targetAccess = "company",
}) {
  const { user } = useContext(AppContext);

  const [step, setStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [isScanning, setIsScanning] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const selectedProviderKey = "gcash";
  const selectedPlan = prices[billingCycle][targetAccess];
  const activeProvider = PAYMENT_PROVIDERS[selectedProviderKey];

  const accessHeader =
    targetAccess === "family" ? "Premium Family Access" : "Full Company Access";
  const getAccessLabel = () =>
    targetAccess === "family" ? "Family Access" : "Company Access";

  // ── IMAGE PICKER & SCANNING ─────────────────────────────────────
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      performOCR(uri);
    }
  };

  const performOCR = async (_uri) => {
    setIsScanning(true);

    // TODO: Replace with real mobile OCR later
    setTimeout(() => {
      setIsScanning(false);
      Alert.alert(
        "OCR Note",
        "AI Scanner is optimizing for mobile.\nPlease verify the Reference Number below."
      );
    }, 1800);
  };

  // ── SUBMIT ──────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!refNumber.trim()) {
      return Alert.alert("Required", "Please enter the GCash Reference Number.");
    }

    const userId = user?.uid || user?.id;

    if (!userId) {
      return Alert.alert("Error", "User ID missing. Please re-login.");
    }

    onUpgradeSuccess({
      amountPaid: selectedPlan.amount,
      plan: billingCycle,
      paymentRef: refNumber.trim(),
      userId,
      method: activeProvider.label,
      targetAccess,
    });
  };

  return (
    <ScrollView className="flex-1 bg-white p-6" showsVerticalScrollIndicator={false}>
      {/* Header Icon */}
      <View
        className={`w-20 h-20 rounded-full items-center justify-center self-center mb-4 shadow-lg ${activeProvider.color}`}
      >
        <CheckCircle2 size={40} color="white" />
      </View>

      <Text className="text-2xl font-bold text-slate-800 text-center">{accessHeader}</Text>

      <View className="flex-row items-center justify-center mt-2 mb-8">
        <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
        <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          AI Receipt Scanner Active
        </Text>
      </View>

      {/* STEP 1: Payment Details */}
      {step === 1 && (
        <View>
          {/* Billing Toggle */}
          <View className="bg-slate-100 p-1 rounded-2xl flex-row mb-6">
            <TouchableOpacity
              onPress={() => setBillingCycle("monthly")}
              className={`flex-1 py-3 rounded-xl items-center ${
                billingCycle === "monthly" ? "bg-white shadow-sm" : ""
              }`}
            >
              <Text
                className={`font-bold text-sm ${
                  billingCycle === "monthly" ? "text-slate-800" : "text-slate-400"
                }`}
              >
                Monthly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setBillingCycle("yearly")}
              className={`flex-1 py-3 rounded-xl items-center ${
                billingCycle === "yearly" ? "bg-white shadow-sm" : ""
              }`}
            >
              <Text
                className={`font-bold text-sm ${
                  billingCycle === "yearly" ? "text-slate-800" : "text-slate-400"
                }`}
              >
                Yearly {targetAccess === "company" ? "(-20%)" : "(-16%)"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-blue-50 flex-row items-center justify-center py-3 rounded-full mb-6">
            <Info size={16} color="#1e40af" />
            <Text className="text-blue-800 font-bold text-xs ml-2">Pay via GCash Only</Text>
          </View>

          {/* Payment Instruction Box */}
          <View
            className={`border-2 border-dashed ${activeProvider.border} ${activeProvider.bgLight} p-6 rounded-3xl mb-8 items-center`}
          >
            <Text className="text-xs text-slate-600 mb-2">
              Send <Text className="font-bold text-slate-900">{selectedPlan.label}</Text> to:
            </Text>
            <Text className={`text-3xl font-bold tracking-tighter ${activeProvider.text}`}>
              {activeProvider.number}
            </Text>
            <Text className="text-[10px] text-slate-400 mt-2 uppercase font-black">
              {activeProvider.accountName}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setStep(2)}
            className={`${activeProvider.color} py-5 rounded-2xl shadow-xl shadow-blue-200 items-center mb-4`}
          >
            <Text className="text-white font-bold text-base">Sent {selectedPlan.label}, Scan Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} className="items-center pb-10">
            <Text className="text-slate-400 font-bold text-xs">Cancel Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2: Scan & Submit */}
      {step === 2 && (
        <View>
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={isScanning}
            className={`border-2 border-dashed rounded-3xl p-10 mb-8 items-center justify-center ${
              isScanning
                ? "border-slate-200 bg-slate-50"
                : `${activeProvider.border} ${activeProvider.bgLight}`
            }`}
          >
            {isScanning ? (
              <View className="items-center">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text className="mt-4 font-bold text-slate-500">Analyzing Receipt...</Text>
              </View>
            ) : selectedImage ? (
              <View className="items-center">
                <Image
                  source={{ uri: selectedImage }}
                  className="w-32 h-32 rounded-2xl mb-3"
                  resizeMode="contain"
                />
                <Text className="text-indigo-600 font-bold text-xs">Tap to Change Photo</Text>
              </View>
            ) : (
              <View className="items-center">
                <Upload size={40} color="#2563eb" />
                <Text className="mt-4 font-bold text-slate-700 text-center">
                  Tap to Upload Receipt Screenshot
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View className="mb-8">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              GCash Reference Number
            </Text>
            <TextInput
              value={refNumber}
              onChangeText={setRefNumber}
              placeholder={isScanning ? "Scanning..." : "e.g. 100554223"}
              keyboardType="numeric"
              className={`p-4 border rounded-2xl text-xl font-bold tracking-widest ${
                refNumber
                  ? "border-green-500 bg-green-50 text-green-800"
                  : "border-slate-200 bg-white"
              }`}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isScanning || !refNumber.trim()}
            className={`py-5 rounded-2xl shadow-xl items-center mb-4 ${
              isScanning || !refNumber.trim() ? "bg-slate-200" : activeProvider.color
            }`}
          >
            <Text className="text-white font-bold text-base">Unlock {getAccessLabel()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setStep(1);
              setRefNumber("");
              setSelectedImage(null);
            }}
            className="flex-row items-center justify-center py-4 mb-10"
          >
            <ArrowLeft size={16} color="#94a3b8" />
            <Text className="text-slate-400 font-bold text-xs ml-2">Back to Payment Info</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}