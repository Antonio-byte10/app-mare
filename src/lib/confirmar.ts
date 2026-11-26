import { Alert, Platform } from 'react-native';

/** Pede confirmação: Alert no celular, `window.confirm` no navegador. */
export function confirmar(
  titulo: string,
  mensagem: string,
  rotuloConfirmar: string,
  aoConfirmar: () => void,
  destrutivo = true,
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensagem}`)) aoConfirmar();
    return;
  }
  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: rotuloConfirmar, style: destrutivo ? 'destructive' : 'default', onPress: aoConfirmar },
  ]);
}
