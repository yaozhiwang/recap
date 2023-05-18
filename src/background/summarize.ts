import { Storage } from "@plasmohq/storage"
import {
  type ChatGPTWebAppProviderConfig,
  ConfigKeys,
  type OpenAIProviderConfig,
  ProviderType,
  getProviderConfigKey,
  providerTypeConfigKey,
  Prompt
} from "~/config"
import type { Provider } from "~/provider"
import { ChatGPTWebAppProvider } from "~provider/chatgpt-webapp"
import { OpenAIChatProvider } from "~provider/openai-chatapi"

export async function summarize(port: chrome.runtime.Port, text: string) {
  const storage = new Storage()
  const providerType = await storage.get<ProviderType>(providerTypeConfigKey)

  const configKey = getProviderConfigKey(providerType)
  const prompt = await new Storage().get<Prompt>(ConfigKeys.prompt)

  let provider: Provider
  if (providerType === ProviderType.ChatGPTWebApp) {
    const config = await storage.get<ChatGPTWebAppProviderConfig>(configKey)
    provider = new ChatGPTWebAppProvider(prompt, config)
  } else if (providerType === ProviderType.OpenaiChatApi) {
    const config = await storage.get<OpenAIProviderConfig>(configKey)
    provider = new OpenAIChatProvider(prompt, config)
  } else {
    throw new Error(`Unknown provider ${providerType}`)
  }
  const controller = new AbortController()
  let cleanup = undefined
  let disconnected = false
  port.onDisconnect.addListener(() => {
    controller.abort()
    disconnected = true
    cleanup?.()
  })
  const ret = await provider.summarize(text, {
    signal: controller.signal,
    onLoading(msg) {
      !disconnected && port.postMessage({ loading: msg })
    },
    onResult(result) {
      !disconnected && port.postMessage({ result })
    },
    onFinish(result) {
      !disconnected && port.postMessage({ finish: result })
    },
    onError(error) {
      !disconnected &&
        port.postMessage({
          error: { code: error.code, message: error.message }
        })
    }
  })
  cleanup = ret?.cleanup
}
