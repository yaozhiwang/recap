export enum MessageNames {
  SummarizeText = "summarize-text",
  SummarizePage = "summarize-page",
  TogglePanel = "toggle-panel",
  UpdateActionIcon = "update-action-icon",
  ProxyResponseMetadata = "proxy-response-metadata",
  ProxyResponseBodyChunk = "proxy-response-body-chunk",
  ProxyTabReady = "proxy-tab-ready",
  FixChatGPTWebAppAuthState = "fix-chatgpt-webapp-auth-state",
  QueryUrl = "query-url"
}

export enum PortNames {
  Summarize = "summarize"
}

export type RequestInitSubset = {
  method?: string
  body?: string
  headers?: Record<string, string>
  signal?: AbortSignal
}

export interface ProxyFetchRequestMessage {
  url: string
  options?: RequestInitSubset
}

export interface ProxyFetchResponseMetadata {
  status?: number
  statusText?: string
  headers?: Record<string, string>
}

export interface ProxyFetchResponseMetadataMessage {
  name: MessageNames.ProxyResponseMetadata
  metadata: ProxyFetchResponseMetadata
}

export type ProxyFetchResponseBodyChunkMessage = {
  name: MessageNames.ProxyResponseBodyChunk
} & ({ done: true } | { done: false; value: string })
