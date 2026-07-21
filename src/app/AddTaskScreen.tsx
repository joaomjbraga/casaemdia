import { useRouter } from 'expo-router';
import React from 'react';
import AddTaskForm from '@/components/tasks/AddTaskForm';
import { SafeAreaView, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

export default function AddTaskScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <AddTaskForm onClose={() => router.back()} onCreated={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
});
