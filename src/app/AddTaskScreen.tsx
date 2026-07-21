import { useRouter } from 'expo-router';
import React from 'react';
import AddTaskForm from '@/components/tasks/AddTaskForm';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

export default function AddTaskScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <AddTaskForm
        onClose={() => router.back()}
        onCreated={() => router.back()}
      />
    </SafeAreaView>
  );
}
