import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Tela } from "@/components/Tela";
import { Texto } from "@/components/Texto";
import { Vazio } from "@/components/Vazio";
import { useMare } from "@/store";

// Lista provisória: a tela Início de verdade chega com o resto do núcleo.
export default function Inicio() {
  const habitos = useMare((e) => e.habitos);
  const router = useRouter();
  return (
    <Tela>
      {habitos.length === 0 ? (
        <Vazio />
      ) : (
        <View style={{ gap: 14 }}>
          <Texto tipo="titulo">Seus hábitos</Texto>
          {habitos.map((h) => (
            <Pressable
              key={h.id}
              onPress={() => router.push(`/habito/${h.id}`)}
              accessibilityRole="button"
            >
              <Texto>{h.apelido}</Texto>
              <Texto tipo="legenda">
                {h.meta.tipo === "parar"
                  ? "Parar"
                  : `Reduzir: até ${h.meta.maxPorDia} ${h.meta.unidade} por dia`}
              </Texto>
            </Pressable>
          ))}
          <Pressable
            onPress={() => router.push("/habito/novo")}
            accessibilityRole="button"
          >
            <Texto cor="#6FD3E0">Adicionar hábito</Texto>
          </Pressable>
        </View>
      )}
    </Tela>
  );
}
