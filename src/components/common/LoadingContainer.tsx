import React from "react";
import { ActivityIndicator, SafeAreaView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "@/constants/Colors";

interface LoadingContainerProps {
  text?: string;
  color?: string;
  fullScreen?: boolean;
}

export default function LoadingContainer({
  text = "Carregando...",
  color = Colors.light.primary,
  fullScreen = true,
}: LoadingContainerProps) {
  const content = (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <ActivityIndicator size="large" color={color} />
        {!!text && (
          <Text style={[styles.text, { color: Colors.light.mutedText }]}>
            {text}
          </Text>
        )}
      </View>
    </View>
  );

  if (fullScreen) {
    return <SafeAreaView style={styles.safeArea}>{content}</SafeAreaView>;
  }

  return content;
}

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  } as const,
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: "center",
    alignItems: "center",
  } as const,
  content: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  } as const,
  text: {
    fontSize: 15,
    fontWeight: "500",
  } as const,
};
