'use client';

import { useState, useContext, useRef } from "react";
import Tesseract from 'tesseract.js';
import { AppContext } from "@/src/context/AppContext"; 
import { toast } from 'react-hot-toast';
import UnifiedLoadingWidget from "@/src/components/ui/UnifiedLoadingWidget";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const PAYMENT_PROVIDERS = {
    gcash: {
        id: 'gcash',
        label: 'GCash',
        color: 'bg-blue-600',
        ring: 'ring-blue-100',
        text: 'text-blue-600',
        bgLight: 'bg-blue-50',
        number: '0917-123-4567',
        accountName: 'Eman Ryan L. Aguilera'
    }
};

const prices = {
    monthly: { 
        family: { amount: 500, label: "₱500" },
        company: { amount: 1500, label: "₱1,500" }
    },
    yearly:  { 
        family: { amount: 5000, label: "₱5,000" },
        company: { amount: 15000, label: "₱15,000" }
    }
};

export default function ApplyPremiumWidget({ onClose, onUpgradeSuccess, targetAccess = 'company' }) {
    const { user } = useContext(AppContext) || {};
    
    const [step, setStep] = useState(1);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refNumber, setRefNumber] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const selectedPlan = prices[billingCycle][targetAccess]; 
    const activeProvider = PAYMENT_PROVIDERS.gcash;
    
    const accessHeader = targetAccess === 'family' ? 'Premium Family Access' : 'Full Company Access';

    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setIsScanning(true);

        Tesseract.recognize(
            file,
            'eng',
            { logger: m => console.log(m) }
        ).then(({ data: { text } }) => {
            processScannedText(text);
            setIsScanning(false);
            toast.success("Receipt read successfully!");
        }).catch(err => {
            console.error(err);
            setIsScanning(false);
            toast.error("Could not read receipt image automatically. Please type reference number.");
        });
    };

    const processScannedText = (text) => {
        const cleanText = text.toUpperCase();
        const refMatch = cleanText.match(/(\d{10,13})/); 
        
        if (refMatch) {
            setRefNumber(refMatch[1]);
        } else {
            const fallbackMatch = cleanText.match(/(\d{8,9})/);
            if (fallbackMatch) {
                setRefNumber(fallbackMatch[1]);
            } else {
                 toast("Reference number not clearly detected. Please check manually.");
            }
        }
    };

    const handleSubmit = async () => {
        if (!refNumber) return toast.error("Please enter the Reference Number.");
        
        const userIdToUse = user?.uid || user?.id; 
        if (!userIdToUse) return toast.error("System Error: User ID missing.");

        setIsSubmitting(true);
        let receiptUrl = null;

        try {
            // Upload Screenshot to Cloudinary if file provided
            if (selectedFile) {
                const fd = new FormData();
                fd.append('file', selectedFile);
                fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const res = await fetch(CLOUD_URL, { method: 'POST', body: fd });
                if (res.ok) {
                    const data = await res.json();
                    receiptUrl = data.secure_url;
                }
            }

            // Passes all transaction metadata to UserRealm handler
            onUpgradeSuccess({
                amountPaid: selectedPlan.amount,
                plan: billingCycle,
                paymentRef: refNumber,
                receiptUrl: receiptUrl,
                userId: userIdToUse, 
                method: activeProvider.label,
                targetAccess: targetAccess
            });
        } catch (err) {
            console.error("Submission error:", err);
            toast.error("Failed to submit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-xl">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-xl ${activeProvider.color}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800">{accessHeader}</h3>
            <div className="flex items-center justify-center gap-2 mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">AI GCash Verification Active</p>
            </div>

            {/* STEP 1: BILLING CYCLE & GCASH NUM */}
            {step === 1 && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-semibold mb-6">
                        <button onClick={() => setBillingCycle('monthly')} className={`flex-1 py-2 rounded-md transition-all ${billingCycle === 'monthly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Monthly</button>
                        <button onClick={() => setBillingCycle('yearly')} className={`flex-1 py-2 rounded-md transition-all ${billingCycle === 'yearly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Yearly ({targetAccess === 'company' ? '-20%' : '-16.6%'})</button>
                    </div>

                    <div className={`border-2 border-dashed ${activeProvider.bgLight} border-blue-200 p-5 rounded-xl mb-6`}>
                        <p className="text-xs text-gray-600 mb-1">Send <strong className="text-gray-900">{selectedPlan.label}</strong> to:</p>
                        <p className={`text-2xl font-mono font-bold tracking-tight ${activeProvider.text}`}>{activeProvider.number}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">{activeProvider.accountName}</p>
                    </div>

                    <button onClick={() => setStep(2)} className={`w-full py-4 text-white rounded-lg font-bold shadow-lg hover:opacity-90 transition-all ${activeProvider.color}`}>I have sent {selectedPlan.label}, Scan Receipt</button>
                    <button onClick={onClose} className="mt-3 text-xs text-gray-400 font-bold uppercase tracking-widest block mx-auto">Cancel</button>
                </div>
            )}

            {/* STEP 2: SCREENSHOT UPLOAD & REF INPUT */}
            {step === 2 && (
                <div className="animate-in zoom-in-95 duration-300">
                    {isScanning || isSubmitting ? (
                        <div className="py-8">
                            <UnifiedLoadingWidget type="section" message={isSubmitting ? "Uploading receipt..." : "AI is reading GCash screenshot..."} />
                        </div>
                    ) : (
                        <div 
                            onClick={() => fileInputRef.current?.click()} 
                            className={`border-2 border-dashed rounded-xl p-6 mb-4 cursor-pointer transition-all ${selectedFile ? 'border-green-500 bg-green-50' : 'border-blue-200 bg-blue-50 hover:bg-white'}`}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                            <div className="flex flex-col items-center">
                                <svg className={`w-10 h-10 mb-2 ${selectedFile ? 'text-green-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p className="text-sm font-bold text-gray-700">
                                    {selectedFile ? selectedFile.name : "Tap to Upload GCash Screenshot"}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="text-left mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Reference Number</label>
                        <input 
                            type="text" 
                            value={refNumber} 
                            onChange={(e) => setRefNumber(e.target.value)} 
                            placeholder={isScanning ? "Scanning..." : "Enter manually if needed"} 
                            className={`w-full p-4 border rounded-xl outline-none font-mono text-lg tracking-widest ${refNumber ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200'}`} 
                        />
                    </div>

                    <button 
                        onClick={handleSubmit} 
                        disabled={isScanning || isSubmitting || !refNumber} 
                        className={`w-full py-4 text-white rounded-lg font-bold shadow-lg transition-all ${isScanning || isSubmitting || !refNumber ? 'bg-gray-300 cursor-not-allowed' : `${activeProvider.color} hover:opacity-90 active:scale-95`}`}
                    >
                        Submit for Verification
                    </button>
                    <button onClick={() => { setStep(1); setRefNumber(''); setSelectedFile(null); }} className="w-full mt-3 py-2 text-gray-400 text-xs font-black uppercase tracking-widest">Back</button>
                </div>
            )}
        </div>
    );
}