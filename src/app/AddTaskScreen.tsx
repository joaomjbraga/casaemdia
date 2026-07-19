import { useRouter } from 'expo-router';
import React from 'react';
import AddTaskForm from '@/components/tasks/AddTaskForm';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddTaskScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <AddTaskForm
        onClose={() => router.back()}
        onCreated={() => router.back()}
      />
    </SafeAreaView>
  );
}
