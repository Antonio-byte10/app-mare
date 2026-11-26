/** Contatos de confiança: validação e número para ligar. Ficam só no celular. */
import type { Contato } from './tipos';

/** Só dígitos, mantendo um "+" no começo. "(11) 98888-7777" -> "11988887777". */
export function normalizarTelefone(texto: string): string {
  const t = texto.trim();
  const digitos = t.replace(/\D/g, '');
  return t.startsWith('+') ? `+${digitos}` : digitos;
}

/** Telefone com 8 a 13 dígitos (de fixo sem DDD a celular com código do país). */
export function telefoneValido(texto: string): boolean {
  const n = normalizarTelefone(texto).replace('+', '');
  return n.length >= 8 && n.length <= 13;
}

export const MAX_NOME_CONTATO = 40;

export function validarContato(nome: string, telefone: string): { nome: string; telefone: string } | { erro: string } {
  const n = nome.trim();
  if (n === '') return { erro: 'Escreva o nome da pessoa.' };
  if (n.length > MAX_NOME_CONTATO) return { erro: `Use até ${MAX_NOME_CONTATO} caracteres no nome.` };
  if (!telefoneValido(telefone)) return { erro: 'Confira o telefone: use o DDD e o número.' };
  return { nome: n, telefone: telefone.trim() };
}

/** Endereço `tel:` para ligar. */
export const urlLigar = (telefone: string) => `tel:${normalizarTelefone(telefone)}`;

export const contatosPorNome = (contatos: Contato[]) => [...contatos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
