import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

export enum ProviderType {
  ChatGPTWebApp = "chatgpt-webapp",
  OpenaiChatApi = "openai-chatapi"
}

export const ProviderTypeName = {
  [ProviderType.ChatGPTWebApp]: "ChatGPT WebApp",
  [ProviderType.OpenaiChatApi]: "OpenAI API"
}

export enum ChatGPTWebModelNames {
  "text-davinci-002-render-sha" = "GPT-3.5",
  "text-davinci-002-render-sha-mobile" = "GPT-3.5 (Mobile)",
  "gpt-4" = "GPT-4",
  "gpt-4-mobile" = "GPT-4 (Mobile)",
  "gpt-4-browsing" = "GPT-4 Browsing"
}
export const defaultChatGPTWebModel = "text-davinci-002-render-sha"

export interface ChatGPTWebAppProviderConfig {
  model: string
  cleanup: boolean
}

export interface OpenAIProviderConfig {
  model: string
  apiKey: string
  apiHost: string
  max_tokens: number
  temperature: number
  top_p: number
}

export const defaultOpenaiAPIHost = "https://api.openai.com"
export const providerTypeConfigKey = "provider"
const defaultProviderConfig = {
  [providerTypeConfigKey]: ProviderType.ChatGPTWebApp,
  [getProviderConfigKey(ProviderType.ChatGPTWebApp)]: {
    cleanup: true,
    model: defaultChatGPTWebModel
  },
  [getProviderConfigKey(ProviderType.OpenaiChatApi)]: {
    apiKey: "",
    apiHost: defaultOpenaiAPIHost,
    model: "gpt-3.5-turbo",
    max_tokens: 4096,
    temperature: 0.8,
    top_p: 0
  }
}

export async function saveDefaultProviderConfigs() {
  const storage = new Storage()

  for (const k in defaultProviderConfig) {
    if ((await storage.get(k)) === undefined) {
      await storage.set(k, defaultProviderConfig[k])
    }
  }
}

export async function migrateDefaultProviderConfigs(previousVersion: string) {
  const storage = new Storage()

  await migrateDefaultOpenaiApiConfig(storage, previousVersion)
  await migrateDefaultChatGPTWebappConfig(storage, previousVersion)
}

async function migrateDefaultOpenaiApiConfig(
  storage: Storage,
  previousVersion: string
) {
  const configKey = getProviderConfigKey(ProviderType.OpenaiChatApi)
  const config = await storage.get<OpenAIProviderConfig>(configKey)
  if (config.apiHost === undefined) {
    await storage.set(configKey, { ...config, apiHost: defaultOpenaiAPIHost })
  }
}

async function migrateDefaultChatGPTWebappConfig(
  storage: Storage,
  previousVersion: string
) {
  const configKey = getProviderConfigKey(ProviderType.ChatGPTWebApp)
  const config = await storage.get<ChatGPTWebAppProviderConfig>(configKey)
  if (config.model === undefined) {
    await storage.set(configKey, { ...config, model: defaultChatGPTWebModel })
  }
}

export function getProviderConfigKey(provider: ProviderType) {
  return `${providerTypeConfigKey}.${provider}`
}

export function useProviderType() {
  return useStorage<ProviderType>(providerTypeConfigKey)
}
