'use client';

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import UnifiedLoadingWidget from '@/components/ui/UnifiedLoadingWidget';
import { 
    Plus, 
    ArrowLeft, 
    Users, 
    Building2, 
    Lock, 
    Wallet, 
    Flag, 
    Gift, 
    Printer, 
    CircleDollarSign, 
    Network, 
    FileBarChart 
} from 'lucide-react-native';

// --- ICONS MAPPING ---
// We use lucide-react-native for consistent styling across Android/iOS
export const Icons = {
    // Basic Actions
    Plus: (props) => <Plus size={16} {...props} />,
    Back: (props) => <ArrowLeft size={16} {...props} />,
    
    // Realm Specific
    Users: (props) => <Users size={16} {...props} />,
    Build: (props) => <Building2 size={16} {...props} />,
    Lock: (props) => <Lock size={16} {...props} />,
    
    // Dashboard Icons (Large)
    Wallet: (props) => <Wallet size={32} {...props} />,
    Flag: (props) => <Flag size={32} {...props} />,
    Gift: (props) => <Gift size={32} {...props} />,
    Printer: (props) => <Printer size={32} {...props} />,
    
    // Admin Specific
    Money: (props) => <CircleDollarSign size={32} {...props} />,
    Entities: (props) => <Network size={32} {...props} />,
    Report: (props) => <FileBarChart size={32} {...props} />
};

// --- BUTTON COMPONENT ---
export const Btn = ({ onClick, type = 'sec', icon, children, className = '', disabled = false, isLoading = false }) => {
    const styles = {
        pri: "bg-indigo-600 border-transparent",
        sec: "bg-white border-slate-300",
        admin: "bg-purple-600 border-transparent",
        comp: "bg-indigo-600 border-transparent",
        pending: "bg-amber-100 border-amber-200"
    };

    const textStyles = {
        pri: "text-white",
        sec: "text-slate-600",
        admin: "text-white",
        comp: "text-white",
        pending: "text-amber-700"
    };

    return (
        <TouchableOpacity
            onPress={disabled || isLoading ? null : onClick}
            disabled={disabled || isLoading}
            activeOpacity={0.7}
            className={`px-4 py-3 rounded-2xl flex-row items-center justify-center border shadow-sm ${styles[type]} ${className}`}
        >
            {isLoading ? (
                <UnifiedLoadingWidget type="inline" />
            ) : (
                <View className="flex-row items-center justify-center">
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text className={`font-bold text-sm ${textStyles[type]}`}>
                        {children}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

// --- DASHBOARD CARD COMPONENT ---
export const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass, isAlert = false, isLoading = false }) => {
    // colorClass here should ideally be a text color hex or Tailwind class like 'text-indigo-600'
    const IconComponent = icon;

    return (
        <TouchableOpacity 
            onPress={isLoading ? null : onClick} 
            activeOpacity={0.8}
            className={`bg-white rounded-3xl border p-5 shadow-sm mb-4 relative overflow-hidden ${isAlert ? 'border-amber-300 bg-amber-50' : 'border-slate-100'}`}
        >
            {/* Overlay for Loading State */}
            {isLoading && (
                <View className="absolute inset-0 z-10 items-center justify-center bg-white/50 backdrop-blur-md">
                    <UnifiedLoadingWidget type="section" />
                </View>
            )}

            <View className="flex-row justify-between items-start mb-4">
                <Text className={`font-black text-xs uppercase tracking-widest flex-1 pr-2 ${isAlert ? 'text-amber-800' : 'text-slate-500'}`}>
                    {title}
                </Text>
                <View className="flex-shrink-0">
                    {IconComponent && <IconComponent className={colorClass} />}
                </View>
            </View>

            <View>
                <Text className={`text-4xl font-black tracking-tighter ${isAlert ? 'text-amber-900' : 'text-slate-800'}`}>
                    {value}
                </Text>
                {subtext && (
                    <Text className={`text-[10px] mt-1 font-bold uppercase tracking-tight ${isAlert ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`}>
                        {subtext}
                    </Text>
                )}
            </View>

            <View className="mt-4 flex-row items-center">
                <Text className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                    {linkText}
                </Text>
                <Text className="text-indigo-600 ml-1">→</Text>
            </View>
        </TouchableOpacity>
    );
};