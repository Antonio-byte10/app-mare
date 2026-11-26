import * as Linking from 'expo-linking';

/** Abre um link (site ou `tel:`). Sem navegador ou discador, não há o que fazer além de não quebrar. */
export function abrirLink(url: string): void {
  Linking.openURL(url).catch(() => undefined);
}
