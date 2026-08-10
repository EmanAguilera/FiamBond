'use client';

import { useState, useContext, FormEvent, ChangeEvent, useMemo } from "react";
import { AppContext } from "@/src/context/AppContext";
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '@/src/config/apiConfig';
import UnifiedLoadingWidget from "@/src/components/ui/UnifiedLoadingWidget";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface Member {
    id: string;
    full_name: string;
}

interface UnifiedProps { 
    onSuccess?: () => void; 
    companyData?: any; 
    familyData?: any; 
    members?: Member[];
}

type TransactionType = "income" | "expense" | "payroll";
type PayrollSubtype = "salary" | "advance";

export default function CreateUnifiedTransactionWidget({ onSuccess, companyData, familyData, members = [] }: UnifiedProps) {
    const { user } = useContext(AppContext) as any;
    
    const companyId = companyData?.id || companyData?._id || (typeof companyData === 'string' ? companyData : null);
    const familyId = familyData?.id || familyData?._id || (typeof familyData === 'string' ? familyData : null);
    const realm = companyId ? 'company' : familyId ? 'family' : 'personal';

    const [form, setForm] = useState({ 
        desc: "", 
        amt: "", 
        type: "expense" as TransactionType,
        payrollSubtype: "salary" as PayrollSubtype,
        employeeId: ""
    });

    // --- PAYROLL INPUTS ---
    const [monthlyBasic, setMonthlyBasic] = useState<number>(25000);
    const [payCycle, setPayCycle] = useState<'semi-monthly' | 'monthly'>('semi-monthly');
    const [lateMinutes, setLateMinutes] = useState<number>(0);
    const [overtimeHours, setOvertimeHours] = useState<number>(0);

    // Government & Custom Deductions
    const [customSss, setCustomSss] = useState<string>('');
    const [customPhil, setCustomPhil] = useState<string>('');
    const [customHdmf, setCustomHdmf] = useState<string>('');
    const [customTax, setCustomTax] = useState<string>('');
    const [customMisc, setCustomMisc] = useState<string>('');

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const incomeLabel = realm === 'company' ? 'Revenue' : 'Income';

    // 💡 CLEAN HOVER MATH INSPECTOR
    const sim = useMemo(() => {
        const basic = parseFloat(String(monthlyBasic)) || 0;
        const workDays = 22; 
        const workHours = 8;  

        const dailyRate = basic / workDays;
        const hourlyRate = dailyRate / workHours;
        const minuteRate = hourlyRate / 60;

        const basePeriodPay = payCycle === 'semi-monthly' ? basic / 2 : basic;

        const tardinessCost = lateMinutes * minuteRate;
        const overtimeGain = overtimeHours * (hourlyRate * 1.25);

        const grossPay = (basePeriodPay - tardinessCost) + overtimeGain;

        const periodFactor = payCycle === 'semi-monthly' ? 0.5 : 1.0;
        const msc = Math.max(4000, Math.min(30000, Math.round(basic / 500) * 500));
        
        const autoSss = (msc * 0.045) * periodFactor;
        const autoPhil = ((Math.max(10000, Math.min(100000, basic)) * 0.05) / 2) * periodFactor;
        const autoHdmf = Math.min(basic * 0.02, 200) * periodFactor;

        const taxableIncome = Math.max(0, grossPay - (autoSss + autoPhil + autoHdmf));
        let autoTax = 0;
        if (payCycle === 'semi-monthly') {
            if (taxableIncome > 10417 && taxableIncome <= 16666) autoTax = (taxableIncome - 10417) * 0.15;
            else if (taxableIncome > 16666 && taxableIncome <= 33332) autoTax = 937.50 + ((taxableIncome - 16666) * 0.20);
            else if (taxableIncome > 33332 && taxableIncome <= 83332) autoTax = 4270.83 + ((taxableIncome - 33332) * 0.25);
            else if (taxableIncome > 83332) autoTax = 16770.83 + ((taxableIncome - 83332) * 0.30);
        }

        const sss = customSss !== '' ? parseFloat(customSss) || 0 : autoSss;
        const phil = customPhil !== '' ? parseFloat(customPhil) || 0 : autoPhil;
        const hdmf = customHdmf !== '' ? parseFloat(customHdmf) || 0 : autoHdmf;
        const tax = customTax !== '' ? parseFloat(customTax) || 0 : autoTax;
        const misc = parseFloat(customMisc) || 0;

        const totalDeductions = sss + phil + hdmf + tax + misc;
        const netPay = Math.max(0, grossPay - totalDeductions);

        return {
            dailyRate,
            hourlyRate,
            minuteRate,
            basePeriodPay,
            tardinessCost,
            overtimeGain,
            grossPay,
            autoSss,
            autoPhil,
            autoHdmf,
            autoTax,
            sss,
            phil,
            hdmf,
            tax,
            misc,
            totalDeductions,
            netPay
        };
    }, [monthlyBasic, payCycle, lateMinutes, overtimeHours, customSss, customPhil, customHdmf, customTax, customMisc]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] || null);
    };

    const submit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return toast.error("Login required");

        const isPayroll = form.type === 'payroll';
        const isSalaryDisburse = isPayroll && form.payrollSubtype === 'salary';

        if (isPayroll && !form.employeeId) return toast.error("Please select an employee");

        const finalAmount = isSalaryDisburse ? sim.netPay : parseFloat(form.amt);
        if (!finalAmount || finalAmount <= 0) return toast.error("Please enter a valid amount");

        setLoading(true);
        try {
            let attachment_url = null;
            const timestamp = new Date().toISOString();

            if (file) {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                const cloudRes = await fetch(CLOUD_URL, { method: 'POST', body: fd });
                if (cloudRes.ok) {
                    const cloudData = await cloudRes.json();
                    attachment_url = cloudData.secure_url;
                }
            }
            
            const employee = members.find(m => m.id === form.employeeId);
            const finalDesc = isPayroll 
                ? `${form.payrollSubtype === 'salary' ? `Salary Payroll (${payCycle.toUpperCase()})` : 'Cash Advance'} for ${employee?.full_name || 'Employee'}`
                : form.desc;

            const transactionBody: Record<string, any> = {
                user_id: user.uid, 
                description: finalDesc,
                amount: finalAmount, 
                type: isPayroll ? 'expense' : form.type,
                category: isPayroll ? (form.payrollSubtype === 'salary' ? 'Payroll' : 'Cash Advance') : null,
                attachment_url,
                created_at: timestamp,
                family_id: realm === 'family' ? familyId : null, 
                company_id: realm === 'company' ? companyId : null,
            };

            const res = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionBody)
            });

            if (!res.ok) throw new Error(`Failed to save record`);

            toast.success(isPayroll ? "Payroll Disbursed!" : "Transaction Recorded");
            setForm({ desc: "", amt: "", type: "expense", payrollSubtype: "salary", employeeId: "" });
            setFile(null); 
            if (onSuccess) onSuccess();

        } catch (error: any) { 
            toast.error(error.message || "Error saving record"); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-5 text-left">
            {/* TYPE SWITCHER */}
            <div className={`grid ${realm === 'company' ? 'grid-cols-3' : 'grid-cols-2'} gap-3 p-1 bg-slate-100 rounded-xl`}>
                <button 
                    type="button" 
                    onClick={() => setForm({ ...form, type: 'income' })}
                    className={`py-2.5 rounded-lg font-bold transition-all ${form.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                    {incomeLabel}
                </button>
                <button 
                    type="button" 
                    onClick={() => setForm({ ...form, type: 'expense' })}
                    className={`py-2.5 rounded-lg font-bold transition-all ${form.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                    Expense
                </button>
                {realm === 'company' && (
                    <button 
                        type="button" 
                        onClick={() => setForm({ ...form, type: 'payroll' })}
                        className={`py-2.5 rounded-lg font-bold transition-all ${form.type === 'payroll' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Payroll
                    </button>
                )}
            </div>

            {/* PAYROLL SUBTYPE SWITCHER */}
            {form.type === 'payroll' && (
                <div className="flex gap-2 p-1 bg-indigo-50 rounded-lg border border-indigo-100">
                    <button 
                        type="button" 
                        onClick={() => setForm({ ...form, payrollSubtype: 'salary' })}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${form.payrollSubtype === 'salary' ? 'bg-indigo-600 text-white' : 'text-indigo-400'}`}
                    >
                        Salary Disburse
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setForm({ ...form, payrollSubtype: 'advance' })}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${form.payrollSubtype === 'advance' ? 'bg-indigo-600 text-white' : 'text-indigo-400'}`}
                    >
                        Cash Advance
                    </button>
                </div>
            )}

            {/* EMPLOYEE SELECTION FOR PAYROLL */}
            {form.type === 'payroll' && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Select Employee</label>
                    <select 
                        value={form.employeeId} 
                        onChange={e => setForm({ ...form, employeeId: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 bg-white font-medium text-sm"
                    >
                        <option value="">-- Choose Employee --</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                    </select>
                </div>
            )}

            {/* 🟢 CLEAN PAYROLL INTERFACE WITH HOVER MOUSE TOOLTIPS */}
            {form.type === 'payroll' && form.payrollSubtype === 'salary' ? (
                <div className="space-y-4">
                    {/* BASE SALARY RATE */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="font-bold text-slate-600">Monthly Basic (₱)</label>
                                {/* 🖱️ HOVER TOOLTIP */}
                                <div className="relative group cursor-pointer">
                                    <span className="text-slate-400 text-[10px] bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 px-1.5 py-0.5 rounded font-mono">ℹ️ Rate</span>
                                    <div className="absolute bottom-full mb-2 right-0 hidden group-hover:flex flex-col z-50 w-56 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl pointer-events-none font-mono">
                                        <span>Rate Derivation:</span>
                                        <span className="text-emerald-400 font-bold">₱{sim.hourlyRate.toFixed(2)} / Hour</span>
                                        <span className="text-slate-300">₱{sim.minuteRate.toFixed(2)} / Minute</span>
                                        <span className="text-slate-400 text-[9px] mt-1">(₱{monthlyBasic.toLocaleString()} ÷ 22 days ÷ 8 hrs)</span>
                                    </div>
                                </div>
                            </div>
                            <input 
                                type="number" 
                                value={monthlyBasic} 
                                onChange={e => setMonthlyBasic(Number(e.target.value))} 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-indigo-600 text-base" 
                            />
                        </div>

                        <div>
                            <label className="font-bold text-slate-600 block mb-1">Pay Cycle</label>
                            <select 
                                value={payCycle} 
                                onChange={(e: any) => setPayCycle(e.target.value)} 
                                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-sm"
                            >
                                <option value="semi-monthly">Semi-Monthly (15th/30th)</option>
                                <option value="monthly">Monthly Full</option>
                            </select>
                        </div>
                    </div>

                    {/* ATTENDANCE & OVERTIME */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="font-bold text-rose-600">Late (Minutes)</label>
                                {/* 🖱️ HOVER TOOLTIP FOR LATE MINUTES */}
                                <div className="relative group cursor-pointer">
                                    <span className="text-rose-600 font-bold text-[11px]">
                                        {lateMinutes > 0 ? `-₱${sim.tardinessCost.toFixed(2)} ℹ️` : 'ℹ️'}
                                    </span>
                                    <div className="absolute bottom-full mb-2 left-0 hidden group-hover:flex flex-col z-50 w-60 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl pointer-events-none font-mono">
                                        <span className="text-rose-300 font-bold">Tardiness Calculation:</span>
                                        <span>{lateMinutes} mins late × ₱{sim.minuteRate.toFixed(2)}/min</span>
                                        <span className="text-rose-400 font-extrabold mt-1">= -₱{sim.tardinessCost.toFixed(2)} Deducted</span>
                                    </div>
                                </div>
                            </div>
                            <input 
                                type="number" 
                                value={lateMinutes} 
                                onChange={e => setLateMinutes(Number(e.target.value))} 
                                className="w-full p-2.5 bg-white border border-rose-200 rounded-xl font-bold text-rose-600 text-sm" 
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="font-bold text-emerald-600">Overtime (Hours)</label>
                                {/* 🖱️ HOVER TOOLTIP FOR OVERTIME */}
                                <div className="relative group cursor-pointer">
                                    <span className="text-emerald-600 font-bold text-[11px]">
                                        {overtimeHours > 0 ? `+₱${sim.overtimeGain.toFixed(2)} ℹ️` : 'ℹ️'}
                                    </span>
                                    <div className="absolute bottom-full mb-2 right-0 hidden group-hover:flex flex-col z-50 w-60 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl pointer-events-none font-mono">
                                        <span className="text-emerald-300 font-bold">Overtime Calculation:</span>
                                        <span>{overtimeHours} OT hrs × (₱{sim.hourlyRate.toFixed(2)} × 1.25 OT Rate)</span>
                                        <span className="text-emerald-400 font-extrabold mt-1">= +₱{sim.overtimeGain.toFixed(2)} Extra Pay</span>
                                    </div>
                                </div>
                            </div>
                            <input 
                                type="number" 
                                step="0.5"
                                value={overtimeHours} 
                                onChange={e => setOvertimeHours(Number(e.target.value))} 
                                className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl font-bold text-emerald-600 text-sm" 
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* DEDUCTIONS (Hover over any field to see why!) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Deductions (Hover ℹ️ to see math)</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="font-bold text-slate-600">SSS</label>
                                    <div className="relative group cursor-pointer">
                                        <span className="text-slate-400 text-[10px]">ℹ️</span>
                                        <div className="absolute bottom-full mb-2 left-0 hidden group-hover:flex flex-col z-50 w-52 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl pointer-events-none font-mono">
                                            <span>SSS Contribution:</span>
                                            <span>2026 Bracket 4.5% EE Share</span>
                                            <span className="text-indigo-300 font-bold">Auto: ₱{sim.autoSss.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <input 
                                    type="number" 
                                    placeholder={`₱${sim.autoSss.toFixed(2)}`}
                                    value={customSss} 
                                    onChange={e => setCustomSss(e.target.value)} 
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold" 
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="font-bold text-slate-600">PhilHealth</label>
                                    <div className="relative group cursor-pointer">
                                        <span className="text-slate-400 text-[10px]">ℹ️</span>
                                        <div className="absolute bottom-full mb-2 left-0 hidden group-hover:flex flex-col z-50 w-52 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl pointer-events-none font-mono">
                                            <span>PhilHealth Premium:</span>
                                            <span>5% Rate ÷ 2 (EE Share)</span>
                                            <span className="text-indigo-300 font-bold">Auto: ₱{sim.autoPhil.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <input 
                                    type="number" 
                                    placeholder={`₱${sim.autoPhil.toFixed(2)}`}
                                    value={customPhil} 
                                    onChange={e => setCustomPhil(e.target.value)} 
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold" 
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="font-bold text-slate-600">Pag-IBIG</label>
                                    <div className="relative group cursor-pointer">
                                        <span className="text-slate-400 text-[10px]">ℹ️</span>
                                        <div className="absolute bottom-full mb-2 right-0 hidden group-hover:flex flex-col z-50 w-52 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl pointer-events-none font-mono">
                                            <span>HDMF Contribution:</span>
                                            <span>2% Rate capped at ₱200/mo</span>
                                            <span className="text-indigo-300 font-bold">Auto: ₱{sim.autoHdmf.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <input 
                                    type="number" 
                                    placeholder={`₱${sim.autoHdmf.toFixed(2)}`}
                                    value={customHdmf} 
                                    onChange={e => setCustomHdmf(e.target.value)} 
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold" 
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="font-bold text-slate-600">BIR Tax</label>
                                    <div className="relative group cursor-pointer">
                                        <span className="text-slate-400 text-[10px]">ℹ️</span>
                                        <div className="absolute bottom-full mb-2 left-0 hidden group-hover:flex flex-col z-50 w-56 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl pointer-events-none font-mono">
                                            <span>Withholding Tax:</span>
                                            <span>TRAIN Law Semi-Monthly Schedule</span>
                                            <span className="text-indigo-300 font-bold">Auto: ₱{sim.autoTax.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <input 
                                    type="number" 
                                    placeholder={`₱${sim.autoTax.toFixed(2)}`}
                                    value={customTax} 
                                    onChange={e => setCustomTax(e.target.value)} 
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold" 
                                />
                            </div>

                            <div className="col-span-2 sm:col-span-2">
                                <label className="font-bold text-slate-600 block mb-1">Misc / Loans (₱)</label>
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    value={customMisc} 
                                    onChange={e => setCustomMisc(e.target.value)} 
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* CLEAN TAKE-HOME PAY SUMMARY CARD (Hover for full equation) */}
                    <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-md flex justify-between items-center group cursor-pointer relative">
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-emerald-200">Take-Home Pay (Net Cash)</p>
                            <p className="text-2xl font-black">₱{sim.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase">Hover ℹ️ Math</span>
                        </div>

                        {/* HOVER SUMMARY TOOLTIP */}
                        <div className="absolute bottom-full mb-2 right-0 hidden group-hover:flex flex-col z-50 w-72 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-2xl pointer-events-none font-mono space-y-1">
                            <span className="text-emerald-400 font-bold">Overall Net Equation:</span>
                            <div className="flex justify-between text-[10px] text-slate-300">
                                <span>Gross Salary:</span>
                                <span>₱{sim.grossPay.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-rose-300">
                                <span>Total Deductions:</span>
                                <span>-₱{sim.totalDeductions.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-slate-700 pt-1 flex justify-between text-emerald-300 font-extrabold">
                                <span>Net Pay:</span>
                                <span>₱{sim.netPay.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* REGULAR INCOME / EXPENSE / ADVANCE INPUTS */
                <>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                            {form.type === 'payroll' ? 'Advance Amount (₱)' : 'Amount (₱)'}
                        </label>
                        <input 
                            type="number" step="0.01" required placeholder="0.00" 
                            value={form.amt} onChange={e => setForm({ ...form, amt: e.target.value })} 
                            className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 text-2xl font-semibold bg-white" 
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                            {form.type === 'payroll' ? 'Notes / Period' : 'Description'}
                        </label>
                        <input 
                            type="text" required 
                            placeholder={form.type === 'income' ? 'e.g. Sales Revenue' : form.type === 'payroll' ? 'e.g. October Cash Advance' : 'e.g. Office Supplies'} 
                            value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} 
                            className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 bg-white" 
                        />
                    </div>
                </>
            )}

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Attachment / Receipt (optional)</label>
                <input 
                    type="file" onChange={handleFileChange} accept="image/*,.pdf"
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50" 
                />
            </div>

            <button 
                type="submit" disabled={loading} 
                className={`w-full py-4 text-white font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70
                    ${form.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                      form.type === 'payroll' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 shadow-lg' : 
                      'bg-rose-600 hover:bg-rose-700'}
                `}
            >
                {loading ? (
                    <UnifiedLoadingWidget type="inline" message="Processing..." />
                ) : (
                    form.type === 'payroll' 
                        ? (form.payrollSubtype === 'salary' ? `Disburse Net Pay (₱${sim.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })})` : 'Disburse Cash Advance') 
                        : 'Save Transaction'
                )}
            </button>
        </form>
    );
}