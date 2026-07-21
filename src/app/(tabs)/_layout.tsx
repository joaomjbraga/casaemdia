import { Tabs } from 'expo-router';
import DockTabBar from '@/components/navigation/DockTabBar';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const colors = Colors.light;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarIconStyle: {
          display: 'none',
        },
      }}
      tabBar={(props) => <DockTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarLabel: 'Início',
        }}
      />
      <Tabs.Screen
        name="shoppinglist"
        options={{
          title: 'Lista de Compras',
          tabBarLabel: 'Compras',
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tarefas',
          tabBarLabel: 'Tarefas',
        }}
      />
    </Tabs>
  );
}
