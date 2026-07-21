import Colors from '@/constants/Colors';
import { StyleSheet } from 'react-native';

const colors = Colors.light;

export const dialogStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dialogContent: {
    backgroundColor: colors.dialogBackground,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '88%',
    maxWidth: 340,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
