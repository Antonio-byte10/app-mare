import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';

export default function Aprender() {
  return (
    <Tela>
      <Texto tipo="titulo">Aprender</Texto>
      <Texto tipo="legenda" style={{ marginTop: 8 }}>
        Em breve neste app.
      </Texto>
    </Tela>
  );
}
