"use client";

import React from "react";
import { View, Text, ActivityIndicator, StyleSheet, Modal } from "react-native";

interface UnifiedLoadingWidgetProps {
  type?: "fullscreen" | "section" | "inline";
  message?: string;
  variant?: "indigo" | "emerald" | "rose" | "slate" | "white";
}

export default function UnifiedLoadingWidget({
  type = "section",
  message = "Loading...",
  variant = "indigo",
}: UnifiedLoadingWidgetProps) {
  
  // Mapping variants to hex codes for the ActivityIndicator
  const colors = {
    indigo: "#4f46e5",
    emerald: "#10b981",
    rose: "#e11d48",
    slate: "#475569",
    white: "#FFFFFF",
  };

  const currentColor = colors[variant];

  // --- FULLSCREEN VIEW ---
  if (type === "fullscreen") {
    return (
      <Modal transparent visible animationType="fade">
        <View className="flex-1 items-center justify-center bg-slate-50/80">
          <View className="items-center">
            <ActivityIndicator size="large" color={currentColor} />
            <Text className="mt-4 text-[10px] font-black uppercase tracking-[3px] text-slate-500">
              {message}
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  // --- SECTION VIEW ---
  if (type === "section") {
    return (
      <View className="items-center justify-center p-12 w-full min-h-[200px]">
        <ActivityIndicator size="small" color={currentColor} />
        {message && (
          <Text className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {message}
          </Text>
        )}
      </View>
    );
  }

  // --- INLINE VIEW (Used inside buttons) ---
  return (
    <View className="flex-row items-center justify-center">
      <ActivityIndicator size="small" color="white" />
      {message && (
        <Text className="ml-2 font-bold text-white text-sm">
          {message}
        </Text>
      )}
    </View>
  );
}