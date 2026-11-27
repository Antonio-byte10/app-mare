/** Horários dos lembretes: "HH:MM" <-> hora e minuto, e instantes no fuso do aparelho. Só lógica pura. */

export const MIN_DIA = 1440;

export type HoraMinuto = { hora: number; minuto: number };

export function lerHorario(h: string): HoraMinuto {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(h);
  return m ? { hora: Number(m[1]), minuto: Number(m[2]) } : { hora: 0, minuto: 0 };
}

const dois = (n: number) => String(n).padStart(2, '0');

export const formatarHorario = (hora: number, minuto: number) => `${dois(hora)}:${dois(minuto)}`;

/** Minutos do dia (0 a 1439) para "HH:MM". */
export const horarioDeMinutos = (min: number) => formatarHorario(Math.floor(min / 60), min % 60);

/** Instante local de um dia ("AAAA-MM-DD") em certa hora e minuto. */
export function instanteDoDia(dia: string, hora: number, minuto: number): number {
  const [a, m, d] = dia.split('-').map(Number);
  return new Date(a, m - 1, d, hora, minuto, 0, 0).getTime();
}
