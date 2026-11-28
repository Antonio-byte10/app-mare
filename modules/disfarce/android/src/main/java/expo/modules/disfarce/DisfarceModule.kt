package expo.modules.disfarce

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.view.WindowManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Privacidade do app no lado nativo:
 * - tela protegida: liga ou desliga o FLAG_SECURE da janela (bloqueia captura e gravação de tela e
 *   esconde o conteúdo na lista de apps recentes). Feito aqui, e não com o expo-screen-capture,
 *   porque aquele módulo registra um observador de capturas ao iniciar que exige a permissão
 *   DETECT_SCREEN_CAPTURE no Android 14+; sem ela (o Maré não pede), o app fechava ao abrir;
 * - disfarce: troca o nome e o ícone do app na tela inicial. O plugin `plugins/with-disfarce.js` declara um
 * `activity-alias` por disfarce no AndroidManifest (só um fica habilitado por vez, e é ele que
 * aparece no launcher). Aqui apenas ligamos um alias e desligamos os outros.
 *
 * Os nomes dos aliases são `<applicationId>.Disfarce<Id>`; no Maré o `namespace` e o `applicationId`
 * são o mesmo ("com.mare.app", definido em `android.package` no app.json).
 */
class DisfarceModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()

  private fun alias(id: String) = ComponentName(context.packageName, "${context.packageName}.Disfarce${id.replaceFirstChar { it.uppercase() }}")

  // Último pedido de tela protegida, reaplicado se a janela for recriada ao voltar para o app.
  @Volatile private var telaProtegida: Boolean? = null

  private fun aplicarTelaProtegida() {
    val ligado = telaProtegida ?: return
    val atividade = appContext.currentActivity ?: return
    atividade.runOnUiThread {
      if (ligado) atividade.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
      else atividade.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("Disfarce")

    Function("protegerTela") { ligado: Boolean ->
      telaProtegida = ligado
      aplicarTelaProtegida()
    }

    OnActivityEntersForeground {
      aplicarTelaProtegida()
    }

    // Id do disfarce que está habilitado agora ("mare" se nenhum tiver sido trocado ainda).
    Function("atual") {
      val pm = context.packageManager
      IDS.firstOrNull { id ->
        when (pm.getComponentEnabledSetting(alias(id))) {
          PackageManager.COMPONENT_ENABLED_STATE_ENABLED -> true
          PackageManager.COMPONENT_ENABLED_STATE_DEFAULT -> id == PADRAO
          else -> false
        }
      } ?: PADRAO
    }

    // Habilita o alias escolhido e desabilita os demais, sem matar o app (DONT_KILL_APP).
    // O novo é habilitado primeiro para nunca ficar sem nenhum ícone no launcher.
    AsyncFunction("definir") { id: String ->
      if (id !in IDS) throw InvalidDisguiseException(id)
      val pm = context.packageManager
      pm.setComponentEnabledSetting(alias(id), PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP)
      IDS.filter { it != id }.forEach {
        pm.setComponentEnabledSetting(alias(it), PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP)
      }
    }
  }

  companion object {
    const val PADRAO = "mare"
    // Mesma lista de `DISFARCES` em src/lib/preferencias.ts e de plugins/with-disfarce.js.
    val IDS = listOf("mare", "diario", "notas", "calma")
  }
}

internal class InvalidDisguiseException(id: String) : CodedException("ERR_DISFARCE_INVALIDO", "Disfarce desconhecido: $id", null)
