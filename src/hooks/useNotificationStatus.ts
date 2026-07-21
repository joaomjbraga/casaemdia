import * as Cellular from 'expo-cellular';
import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { checkPushPermission, requestPushPermission } from '@/lib/onesignal';

export type NotificationStatus = 'checking' | 'active' | 'inactive';

/** Estado da detecção de chip (SIM). */
export type ChipStatus =
  | 'unknown' // ainda não verificado
  | 'present' // chip detectado com serviço de rede móvel
  | 'no-service' // sem serviço GSM (sem sinal / chip sem registro na rede)
  | 'absent' // sem chip
  | 'permission-denied'; // não foi possível verificar (permissão de telefone negada)

interface DetectChipResult {
  chipStatus: ChipStatus;
  carrierName: string | null;
}

interface UseNotificationStatusResult {
  /** Estado consolidado das notificações do dispositivo. */
  status: NotificationStatus;
  /** Permissão de push (OneSignal) concedida. */
  pushEnabled: boolean;
  /** Estado detalhado da detecção de chip. */
  chipStatus: ChipStatus;
  /** Atalho: há um chip (SIM) com serviço de rede confirmado. */
  hasChip: boolean;
  /** Chip presente porém sem serviço GSM (não recebe notificações). */
  noService: boolean;
  /** A permissão de telefone (READ_PHONE_STATE) foi negada. */
  phonePermissionDenied: boolean;
  /** Nome da operadora, quando disponível. */
  carrierName: string | null;
  /** Reavalia manualmente o status (push + chip). */
  refresh: () => Promise<void>;
  /** Solicita a permissão de push ao usuário. */
  requestPermission: () => Promise<void>;
}

/**
 * Detecta a presença de um chip (SIM) e o serviço de rede móvel usando o
 * expo-cellular.
 *
 * `getCarrierNameAsync` / `getMobileCountryCodeAsync` só retornam valor quando o
 * SIM está no estado `SIM_STATE_READY` (Android). `getCellularGenerationAsync`
 * retorna `UNKNOWN` quando não há serviço de rede móvel (equivalente a
 * "GSM service not available"), caso em que o dispositivo não recebe
 * notificações push.
 *
 * Estados possíveis:
 * - `present`: chip com serviço de rede ativo.
 * - `no-service`: chip presente porém sem serviço GSM (sem sinal/registro).
 * - `absent`: nenhum chip.
 * - `permission-denied`: não foi possível verificar (permissão negada).
 */
async function detectChip(): Promise<DetectChipResult> {
  let carrierName: string | null = null;
  let mcc: string | null = null;
  let generation = Cellular.CellularGeneration.UNKNOWN;
  let permissionDenied = false;

  try {
    if (Platform.OS === 'android') {
      // Garante a permissão READ_PHONE_STATE antes de consultar a operadora.
      let perm = await Cellular.getPermissionsAsync();
      if (!perm.granted && perm.canAskAgain) {
        perm = await Cellular.requestPermissionsAsync();
      }
      permissionDenied = !perm.granted;
    }

    [carrierName, mcc, generation] = await Promise.all([
      Cellular.getCarrierNameAsync().catch(() => null),
      Cellular.getMobileCountryCodeAsync().catch(() => null),
      Cellular.getCellularGenerationAsync().catch(() => Cellular.CellularGeneration.UNKNOWN),
    ]);
  } catch {
    // mantém valores nulos; decisão final abaixo
  }

  const carrier = carrierName && carrierName.trim().length > 0 ? carrierName : null;
  // Chip presente e pronto (SIM_STATE_READY) → há operadora ou MCC.
  const chipReady = !!carrier || !!(mcc && mcc.trim().length > 0);
  // Serviço de rede móvel ativo (não é "GSM service not available").
  const hasNetworkService = generation !== Cellular.CellularGeneration.UNKNOWN;

  if (chipReady && hasNetworkService) {
    return { chipStatus: 'present', carrierName: carrier };
  }

  // Fallback: conexão ativa via rede celular confirma chip com serviço.
  try {
    const net = await NetInfo.fetch();
    if (net.type === NetInfoStateType.cellular && net.isConnected) {
      return { chipStatus: 'present', carrierName: carrier };
    }
  } catch {
    // ignora
  }

  // Chip detectado, porém sem serviço GSM → não recebe notificações push.
  if (chipReady && !hasNetworkService) {
    return { chipStatus: 'no-service', carrierName: carrier };
  }

  // Sem sinal de chip. Se a permissão foi negada, não é possível afirmar que
  // não há chip — reportamos o estado ambíguo para não exibir instrução errada.
  if (permissionDenied) {
    return { chipStatus: 'permission-denied', carrierName: null };
  }

  return { chipStatus: 'absent', carrierName: null };
}

/**
 * Monitora se o dispositivo está apto a receber notificações do app.
 *
 * Combina dois sinais:
 * - Permissão de push (OneSignal) — o app pode receber notificações.
 * - Presença de chip (expo-cellular) — requisito para as notificações do app.
 */
export function useNotificationStatus(): UseNotificationStatusResult {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [chipStatus, setChipStatus] = useState<ChipStatus>('unknown');
  const [carrierName, setCarrierName] = useState<string | null>(null);
  const [status, setStatus] = useState<NotificationStatus>('checking');
  const mounted = useRef(true);
  // Token de sequência para descartar resultados de refresh fora de ordem.
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setStatus('checking');

    const [permission, chip] = await Promise.all([checkPushPermission(), detectChip()]);

    // Ignora se desmontado ou se um refresh mais recente já foi disparado.
    if (!mounted.current || currentRequest !== requestId.current) return;

    setPushEnabled(permission);
    setChipStatus(chip.chipStatus);
    setCarrierName(chip.carrierName);
    // Notificações consideradas ativas quando há chip E permissão de push.
    setStatus(permission && chip.chipStatus === 'present' ? 'active' : 'inactive');
  }, []);

  const requestPermission = useCallback(async () => {
    await requestPushPermission();
    await refresh();
  }, [refresh]);

  useEffect(() => {
    mounted.current = true;
    refresh();

    const netUnsub = NetInfo.addEventListener((state) => {
      if (!mounted.current) return;
      if (state.type === NetInfoStateType.cellular && state.isConnected) {
        setChipStatus('present');
      }
    });

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        refresh();
      }
    });

    return () => {
      mounted.current = false;
      netUnsub();
      appStateSub.remove();
    };
  }, [refresh]);

  return {
    status,
    pushEnabled,
    chipStatus,
    hasChip: chipStatus === 'present',
    noService: chipStatus === 'no-service',
    phonePermissionDenied: chipStatus === 'permission-denied',
    carrierName,
    refresh,
    requestPermission,
  };
}
