import { Storage } from "@plasmohq/storage"
import { ConfigKeys, saveDefaultConfigs } from "~/config"

import {
  ChatGPTWebAppProviderConfig,
  getProviderConfigKey,
  OpenAIProviderConfig,
  ProviderType,
  providerTypeConfigKey
} from "~/config"
import type { Provider } from "~/provider"
import { isFirstCacheKey, MessageNames, PortNames } from "~constants"
import {
  ChatGPTWebAppProvider,
  getChatGPTAccessToken
} from "~provider/chatgpt-webapp"
import { OpenAIChatProvider } from "~provider/openai-chatapi"

export {}

chrome.runtime.onInstalled.addListener(async (details) => {
  await saveDefaultConfigs()

  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    await new Storage().set(isFirstCacheKey, true)
    chrome.runtime.openOptionsPage()
  }
})

async function summarize(port: chrome.runtime.Port, text: string) {
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

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: "recap-sum",
    title: "Summarize the selected text",
    type: "normal",
    contexts: ["selection"],
    documentUrlPatterns: ["http://*/*", "https://*/*"]
  })
})

chrome.contextMenus.onClicked.addListener((item, tab) => {
  chrome.tabs.sendMessage(tab.id, {
    name: MessageNames.SummarizeText,
    text: item.selectionText
  })
})

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === PortNames.Summarize) {
    port.onMessage.addListener(async (msg) => {
      if (!msg || msg.content === undefined) {
        port.postMessage({
          error: {
            code: "invalid_message",
            message: "invalid message received"
          }
        })
        return
      }
      if (msg.content === "") {
        port.postMessage({
          error: {
            code: "empty_content",
            message: "the content sent to summarize is empty"
          }
        })
        return
      }
      try {
        await summarize(port, msg.content)
      } catch (error: any) {
        console.error(error)
        port.postMessage({
          error: { code: error.code, message: error.message }
        })
      }
    })
  }
})
