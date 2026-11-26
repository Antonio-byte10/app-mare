import { Alert, Platform } from 'react-native';

/** Pede confirmação: Alert no celular, `window.confirm` no navegador. */
export function confirmar(titulo: string, mensagem: string, rotuloConfirmar: string, aoConfirmar: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensagem}`)) aoConfirmar();
    return;
  }
  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: rotuloConfirmar, style: 'destructive', onPress: aoConfirmar },
  ]);
}
