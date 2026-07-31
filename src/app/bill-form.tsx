import Colors from '@/constants/Colors';
import { useBills } from '@/contexts/BillsContext';
import { useFamily } from '@/contexts/FamilyContext';
import { BILL_CATEGORY_LABELS, BILL_TYPE_LABELS, type BillType, type BillCategory } from '@/types/models';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/date-utils';
import PrimaryActionButton from '@/components/common/PrimaryActionButton';
import ZappIcon from '@/components/common/ZappIcon';
import BackHeader from '@/components/common/BackHeader';
import { useConfirmDialog } from '@/components/shared/ui/dialog/ConfirmDialog';
import { useAlertDialog } from '@/components/shared/ui/dialog/AlertDialog';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ReminderOption = { label: string; value: number };

const REMINDER_OPTIONS: ReminderOption[] = [
  { label: '7 dias antes', value: 7 },
  { label: '1 dia antes', value: 1 },
  { label: 'No dia do vencimento', value: 0 },
];

const CATEGORY_OPTIONS: BillCategory[] = [
  'water', 'electricity', 'internet', 'rent', 'condominium',
  'ipva', 'iptu', 'insurance', 'school_fee', 'other',
];

const TYPE_OPTIONS: BillType[] = ['unique', 'recurring'];

function formatDateForInput(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseInputDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getInitialDueDate(): Date {
  const now = new Date();
  now.setDate(now.getDate() + 7);
  return now;
}

export default function BillFormScreen() {
  const params = useLocalSearchParams<{
    billId?: string;
    familyId?: string;
  }>();
  const isEdit = Boolean(params.billId);

  const { familyId } = useFamily();
  const { createBill, updateBill, getBillDetail } = useBills();
  const { showDialog } = useConfirmDialog();
  const { showAlert } = useAlertDialog();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(formatDateForInput(getInitialDueDate()));
  const [type, setType] = useState<BillType>('unique');
  const [category, setCategory] = useState<BillCategory>('other');
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('1');
  const [reminderSelections, setReminderSelections] = useState<Record<number, boolean>>({
    7: true,
    1: true,
    0: true,
  });
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const currentFamilyId = familyId ?? params.familyId;

  const parsedAmount = useMemo(() => {
    const val = parseFloat(amount);
    return isNaN(val) || val <= 0 ? null : val;
  }, [amount]);

  useEffect(() => {
    if (isEdit && params.billId && currentFamilyId) {
      const loadBill = async () => {
        setLoading(true);
        try {
          const result = await getBillDetail(params.billId!);
          if (!result) {
            showAlert({ title: 'Erro', message: 'Conta não encontrada.', type: 'error' });
            router.back();
            return;
          }
          const bill = result.bill;
          setTitle(bill.title);
          setDescription(bill.description ?? '');
          setAmount(String(bill.amount));
          setDueDate(formatDateForInput(new Date(bill.dueDate)));
          setType(bill.type);
          setCategory(bill.category as BillCategory);
          const installments = bill.totalInstallments > 1;
          setIsInstallment(installments);
          setTotalInstallments(String(bill.totalInstallments));

          const reminderMap: Record<number, boolean> = {};
          bill.reminderDays.forEach((d) => {
            reminderMap[d] = true;
          });
          setReminderSelections(reminderMap);
        } catch {
          showAlert({ title: 'Erro', message: 'Não foi possível carregar a conta.', type: 'error' });
        } finally {
          setLoading(false);
        }
      };
      loadBill();
    }
  }, [isEdit, params.billId, currentFamilyId, getBillDetail, showAlert]);

  const toggleReminder = (value: number) => {
    setReminderSelections((prev) => ({
      ...prev,
      [value]: !prev[value],
    }));
  };

  const reminderDays = useMemo(() => {
    return REMINDER_OPTIONS.filter((opt) => reminderSelections[opt.value]).map((opt) => opt.value);
  }, [reminderSelections]);

  const installmentAmount = useMemo(() => {
    if (!isInstallment || !parsedAmount) return null;
    const total = parseInt(totalInstallments) || 1;
    if (total <= 1) return null;
    return formatCurrency(parsedAmount / total);
  }, [isInstallment, parsedAmount, totalInstallments]);

  const handleSubmit = async () => {
    if (!currentFamilyId) {
      toast.error('Família não carregada.');
      return;
    }

    if (!title.trim()) {
      toast.error('Digite o título da conta.');
      return;
    }

    if (parsedAmount === null) {
      toast.error('Digite um valor válido.');
      return;
    }

    if (reminderDays.length === 0) {
      toast.error('Selecione pelo menos um lembrete.');
      return;
    }

    const installments = isInstallment ? Math.max(1, parseInt(totalInstallments) || 1) : 1;

    setLoading(true);
    try {
      if (isEdit && params.billId) {
        await updateBill(params.billId, {
          title: title.trim(),
          description: description.trim() || null,
          amount: parsedAmount,
          dueDate: parseInputDate(dueDate),
          category,
          reminderDays,
        });
        toast.success('Conta atualizada!');
      } else {
        await createBill(currentFamilyId, {
          title: title.trim(),
          description: description.trim() || null,
          amount: parsedAmount,
          dueDate: parseInputDate(dueDate),
          type,
          category,
          totalInstallments: installments,
          reminderDays,
        });
        toast.success('Conta criada!');
      }
      router.back();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível salvar a conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!params.billId) return;
    showDialog({
      title: 'Excluir conta',
      message: `Remover "${title}"?`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          const { deleteBill } = await import('@/services/bills');
          await deleteBill(params.billId!);
          toast.success('Conta excluída!');
          router.back();
        } catch {
          showAlert({ title: 'Erro', message: 'Não foi possível excluir.', type: 'error' });
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BackHeader title={isEdit ? 'Editar Conta' : 'Nova Conta'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Conta de luz"
              placeholderTextColor={Colors.light.mutedText}
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>R$</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0,00"
                placeholderTextColor={Colors.light.mutedText}
                style={styles.amountInput}
                keyboardType="decimal-pad"
              />
            </View>
            {parsedAmount !== null && (
              <Text style={styles.amountPreview}>{formatCurrency(parsedAmount)}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vencimento</Text>
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={Colors.light.mutedText}
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo</Text>
            <TouchableOpacity
              style={[styles.pickerTrigger, { backgroundColor: Colors.light.cardBackground, borderColor: Colors.light.border }]}
              onPress={() => setShowTypePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerText}>{BILL_TYPE_LABELS[type]}</Text>
              <ZappIcon name="chevron-down" size={18} color={Colors.light.mutedText} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria</Text>
            <TouchableOpacity
              style={[styles.pickerTrigger, { backgroundColor: Colors.light.cardBackground, borderColor: Colors.light.border }]}
              onPress={() => setShowCategoryPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerText}>{BILL_CATEGORY_LABELS[category]}</Text>
              <ZappIcon name="chevron-down" size={18} color={Colors.light.mutedText} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parcelamento</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleOption, !isInstallment && styles.toggleOptionActive]}
                onPress={() => setIsInstallment(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, !isInstallment && styles.toggleTextActive]}>Única</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, isInstallment && styles.toggleOptionActive]}
                onPress={() => setIsInstallment(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, isInstallment && styles.toggleTextActive]}>Parcelada</Text>
              </TouchableOpacity>
            </View>

            {isInstallment && (
              <View style={styles.installmentInputGroup}>
                <Text style={styles.label}>Número de parcelas</Text>
                <TextInput
                  value={totalInstallments}
                  onChangeText={setTotalInstallments}
                  placeholder="12"
                  placeholderTextColor={Colors.light.mutedText}
                  style={styles.textInput}
                  keyboardType="numeric"
                  maxLength={2}
                />
                {parsedAmount !== null && installmentAmount && (
                  <Text style={styles.installmentPreview}>
                    {installmentAmount} por parcela
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lembretes</Text>
            <View style={styles.reminderContainer}>
              {REMINDER_OPTIONS.map((opt) => {
                const selected = reminderSelections[opt.value];
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.reminderOption,
                      selected && styles.reminderOptionSelected,
                    ]}
                    onPress={() => toggleReminder(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.reminderText, selected && styles.reminderTextSelected]}>
                      {opt.label}
                    </Text>
                    {selected && (
                      <ZappIcon name="check" size={14} color={Colors.light.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Detalhes adicionais..."
              placeholderTextColor={Colors.light.mutedText}
              style={[styles.textInput, styles.multilineInput]}
              multiline
              numberOfLines={3}
            />
          </View>

          <PrimaryActionButton
            title={loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar'}
            icon={isEdit ? 'content-save' : 'plus'}
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            style={styles.submitBtn}
          />

          {isEdit && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <ZappIcon name="trash-can-outline" size={18} color={Colors.light.danger} />
              <Text style={styles.deleteBtnText}>Excluir conta</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {showCategoryPicker && (
        <CategoryPicker
          selected={category}
          onSelect={(cat) => {
            setCategory(cat);
            setShowCategoryPicker(false);
          }}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}

      {showTypePicker && (
        <TypePicker
          selected={type}
          onSelect={(t) => {
            setType(t);
            setShowTypePicker(false);
          }}
          onClose={() => setShowTypePicker(false)}
        />
      )}
    </SafeAreaView>
  );
}

function CategoryPicker({
  selected,
  onSelect,
  onClose,
}: {
  selected: BillCategory;
  onSelect: (cat: BillCategory) => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.pickerOverlay}>
      <View style={styles.pickerContainer}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Categoria</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <ZappIcon name="close" size={20} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {CATEGORY_OPTIONS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.pickerItem,
                selected === cat && styles.pickerItemSelected,
              ]}
              onPress={() => {
                onSelect(cat);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerItemText, selected === cat && styles.pickerItemTextSelected]}>
                {BILL_CATEGORY_LABELS[cat]}
              </Text>
              {selected === cat && (
                <ZappIcon name="check" size={16} color={Colors.light.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function TypePicker({
  selected,
  onSelect,
  onClose,
}: {
  selected: BillType;
  onSelect: (type: BillType) => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.pickerOverlay}>
      <View style={styles.pickerContainer}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Tipo de conta</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <ZappIcon name="close" size={20} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {TYPE_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.pickerItem,
                selected === t && styles.pickerItemSelected,
              ]}
              onPress={() => {
                onSelect(t);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerItemText, selected === t && styles.pickerItemTextSelected]}>
                {BILL_TYPE_LABELS[t]}
              </Text>
              {selected === t && (
                <ZappIcon name="check" size={16} color={Colors.light.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  textInput: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    minHeight: 52,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.mutedText,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    padding: 0,
    minHeight: 40,
  },
  amountPreview: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.mutedText,
    marginTop: 4,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.cardBackground,
  },
  toggleOptionActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.mutedText,
  },
  toggleTextActive: {
    color: Colors.light.textWhite,
  },
  installmentInputGroup: {
    gap: 8,
    marginTop: 4,
  },
  installmentPreview: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.info,
    marginTop: 4,
  },
  reminderContainer: {
    gap: 8,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.cardBackground,
  },
  reminderOptionSelected: {
    backgroundColor: `${Colors.light.primary}10`,
    borderColor: Colors.light.primary,
  },
  reminderText: {
    fontSize: 15,
    color: Colors.light.mutedText,
  },
  reminderTextSelected: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 12,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${Colors.light.danger}30`,
    backgroundColor: `${Colors.light.danger}10`,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.danger,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  pickerItemSelected: {
    backgroundColor: `${Colors.light.primary}08`,
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  pickerItemTextSelected: {
    fontWeight: '700',
    color: Colors.light.primary,
  },
});
