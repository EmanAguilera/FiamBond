import { useState, useContext, useRef } from "react";
import Tesseract from 'tesseract.js';
import { AppContext } from "../../../Context/AppContext"; 

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
    },
    maya: {
        id: 'maya',
        label: 'Maya',
        color: 'bg-green-600',
        ring: 'ring-green-100',
        text: 'text-green-600',
        bgLight: 'bg-green-50',
        number: '0918-987-6543',
        accountName: 'Eman Ryan L. Aguilera'
    },
    bdo: {
        id: 'bdo',
        label: 'BDO Unibank',
        color: 'bg-indigo-700',
        ring: 'ring-indigo-100',
        text: 'text-indigo-700',
        bgLight: 'bg-indigo-50',
        number: '0012-3456-7890',
        accountName: 'FiamBond Inc.'
    }
};

export default function ApplyCompanyWidget({ onClose, onUpgradeSuccess }) {
    const { user } = useContext(AppContext);
    
    const [step, setStep] = useState(1);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [selectedProviderKey, setSelectedProviderKey] = useState('gcash');
    
    const [isScanning, setIsScanning] = useState(false);
    const [refNumber, setRefNumber] = useState('');
    const fileInputRef = useRef(null);

    const prices = {
        monthly: { amount: 1500, label: "₱1,500" },
        yearly:  { amount: 15000, label: "₱15,000" }
    };
    const selectedPlan = prices[billingCycle];
    const activeProvider = PAYMENT_PROVIDERS[selectedProviderKey];

    // --- AI SCANNING ---
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsScanning(true);

        Tesseract.recognize(
            file,
            'eng',
            { logger: m => console.log(m) }
        ).then(({ data: { text } }) => {
            processScannedText(text);
            setIsScanning(false);
        }).catch(err => {
            console.error(err);
            setIsScanning(false);
            alert("Could not read image. Please type manually.");
        });
    };

    const processScannedText = (text) => {
        const cleanText = text.toUpperCase();
        const refMatch = cleanText.match(/(\d{8,13})/);
        
        if (refMatch) {
            setRefNumber(refMatch[1]);
        } else {
            alert("Reference number not clearly detected. Please double check.");
        }
    };

    // --- SUBMIT ---
    const handleSubmit = () => {
        if(!refNumber) return alert("Please enter the Reference Number.");
        
        // --- THE FIX IS HERE ---
        // We use user.uid because that is what Firebase Auth provides.
        const userIdToUse = user.uid || user.id; 

        if (!userIdToUse) {
            console.error("User ID is missing!", user);
            return alert("System Error: User ID missing. Please re-login.");
        }

        onUpgradeSuccess({
            amountPaid: selectedPlan.amount,
            plan: billingCycle,
            paymentRef: refNumber,
            userId: userIdToUse, // <--- UPDATED
            method: activeProvider.label 
        });
    };

    return (
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-xl">
            {/* ICON */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-xl transition-colors duration-300 ${activeProvider.color}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800">Company Access</h3>
            <div className="flex items-center justify-center gap-2 mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">AI Receipt Scanner Active</p>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-semibold mb-6">
                        <button onClick={() => setBillingCycle('monthly')} className={`flex-1 py-2 rounded-md transition-all ${billingCycle === 'monthly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Monthly</button>
                        <button onClick={() => setBillingCycle('yearly')} className={`flex-1 py-2 rounded-md transition-all ${billingCycle === 'yearly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Yearly (-20%)</button>
                    </div>

                    <p className="text-xs text-left font-bold text-gray-400 uppercase mb-2">Select Payment Method</p>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {Object.keys(PAYMENT_PROVIDERS).map((key) => {
                            const p = PAYMENT_PROVIDERS[key];
                            return (
                                <button key={key} onClick={() => setSelectedProviderKey(key)} className={`py-3 px-1 text-[10px] sm:text-xs font-bold rounded-xl border transition-all duration-200 ${selectedProviderKey === key ? `${p.color} text-white border-transparent shadow-lg transform scale-105` : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{p.label}</button>
                            );
                        })}
                    </div>

                    <div className={`border-2 border-dashed ${activeProvider.bgLight} ${activeProvider.text.replace('text', 'border')} p-5 rounded-xl mb-6 relative overflow-hidden transition-all duration-300`}>
                        <p className="text-xs text-gray-600 mb-1">Send <strong className="text-gray-900">{selectedPlan.label}</strong> to:</p>
                        <p className={`text-2xl font-mono font-bold tracking-tight ${activeProvider.text}`}>{activeProvider.number}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">{activeProvider.accountName}</p>
                    </div>

                    <button onClick={() => setStep(2)} className={`w-full py-3 text-white rounded-lg font-bold shadow-lg hover:opacity-90 transition-all ${activeProvider.color}`}>I have paid, Scan Receipt</button>
                    <button onClick={onClose} className="mt-3 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
                <div className="animate-in zoom-in-95 duration-300">
                    <div onClick={() => !isScanning && fileInputRef.current.click()} className={`relative border-2 border-dashed rounded-xl p-8 mb-6 cursor-pointer transition-all ${isScanning ? 'border-gray-300 bg-gray-50 cursor-wait' : `${activeProvider.text.replace('text', 'border')} ${activeProvider.bgLight} hover:bg-white`}`}>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                        {isScanning ? (
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 border-4 border-gray-200 rounded-full animate-spin mb-3 border-t-indigo-600`}></div>
                                <p className="text-sm font-bold text-gray-600 animate-pulse">Analyzing Receipt...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center group">
                                <svg className={`w-10 h-10 mb-3 transition-transform group-hover:-translate-y-1 ${activeProvider.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <p className="text-sm font-bold text-gray-700">Tap to Upload Screenshot</p>
                            </div>
                        )}
                    </div>

                    <div className="text-left mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reference Number</label>
                        <div className="relative">
                            <input type="text" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} placeholder={isScanning ? "Scanning..." : "e.g. 100554223"} className={`w-full p-3 pl-4 border rounded-lg outline-none font-mono text-lg tracking-widest transition-all ${refNumber ? 'border-green-500 bg-green-50 text-green-800 focus:ring-2 focus:ring-green-200' : 'border-gray-300 focus:border-indigo-500'}`} />
                        </div>
                    </div>

                    <button onClick={handleSubmit} disabled={isScanning || !refNumber} className={`w-full py-3 text-white rounded-lg font-bold shadow-lg transition-all ${isScanning || !refNumber ? 'bg-gray-300 cursor-not-allowed' : `${activeProvider.color} hover:opacity-90`}`}>Verify & Upgrade</button>
                    <button onClick={() => { setStep(1); setRefNumber(''); }} className="w-full mt-3 py-2 text-gray-400 text-xs font-medium hover:text-gray-600">Change Payment Method</button>
                </div>
            )}
        </div>
    );
}