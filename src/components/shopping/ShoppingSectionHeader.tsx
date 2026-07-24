import SectionTitle from '@/components/shopping/SectionTitle';
import Colors from '@/constants/Colors';
import { StyleSheet, View } from 'react-native';

interface ShoppingSectionHeaderProps {
  label: string;
  done?: boolean;
}

export default function ShoppingSectionHeader({ label, done = false }: ShoppingSectionHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={[styles.dot, done && styles.dotDone]} />
        <SectionTitle
          label={label}
          color={done ? Colors.light.success : Colors.light.text}
          fontSize={11}
          fontWeight="700"
          letterSpacing={1.1}
          uppercase
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  dotDone: {
    backgroundColor: Colors.light.success,
  },
});
