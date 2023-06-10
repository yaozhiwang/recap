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

export interface ChatGPTWebAppProviderConfig {
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

export const defaulOpenaiAPIHost = "https://api.openai.com"
export const providerTypeConfigKey = "provider"
const defaultProviderConfig = {
  [providerTypeConfigKey]: ProviderType.ChatGPTWebApp,
  [getProviderConfigKey(ProviderType.ChatGPTWebApp)]: { cleanup: true },
  [getProviderConfigKey(ProviderType.OpenaiChatApi)]: {
    apiKey: "",
    apiHost: defaulOpenaiAPIHost,
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

  const configKey = getProviderConfigKey(ProviderType.OpenaiChatApi)
  const config = await storage.get<OpenAIProviderConfig>(configKey)
  if (config.apiHost === undefined) {
    await storage.set(configKey, { ...config, apiHost: defaulOpenaiAPIHost })
  }
}

export function getProviderConfigKey(provider: ProviderType) {
  return `${providerTypeConfigKey}.${provider}`
}

export function useProviderType() {
  return useStorage<ProviderType>(providerTypeConfigKey)
}
