import { Storage } from "@plasmohq/storage"
import {
  ChatGPTWebAppProviderConfig,
  ConfigKeys,
  OpenAIProviderConfig,
  ProviderType,
  getProviderConfigKey,
  providerTypeConfigKey
} from "~/config"
import type { Provider } from "~/provider"
import {
  ChatGPTWebAppProvider,
  getChatGPTAccessToken
} from "~provider/chatgpt-webapp"
import { OpenAIChatProvider } from "~provider/openai-chatapi"

export async function summarize(port: chrome.runtime.Port, text: string) {
  const storage = new Storage()
  const providerType = await storage.get<ProviderType>(providerTypeConfigKey)

  const configKey = getProviderConfigKey(providerType)
  const prompt = await new Storage().get(ConfigKeys.prompt)

  let provider: Provider
  if (providerType === ProviderType.ChatGPTWebApp) {
    const token = await getChatGPTAccessToken()
    const config = await storage.get<ChatGPTWebAppProviderConfig>(configKey)
    provider = new ChatGPTWebAppProvider(prompt, token, config)
  } else if (providerType === ProviderType.OpenaiChatApi) {
    const config = await storage.get<OpenAIProviderConfig>(configKey)
    provider = new OpenAIChatProvider(prompt, config)
  } else {
    throw new Error(`Unknown provider ${providerType}`)
  }
  const controller = new AbortController()
  port.onDisconnect.addListener(() => {
    controller.abort()
    cleanup?.()
  })
  const ret = await provider.summarize(text, {
    signal: controller.signal,
    onResult(result) {
      port.postMessage({ result })
    },
    onFinish(result) {
      port.postMessage({ finish: result })
    },
    onError(error) {
      port.postMessage({ error: { code: error.code, message: error.message } })
    }
  })
  const cleanup = ret?.cleanup
}
