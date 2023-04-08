import ExpiryMap from "expiry-map"
import { v4 as uuidv4 } from "uuid"
import type { ChatGPTWebAppProviderConfig } from "~config/provider"
import {
  ProviderBackendError,
  ProviderError,
  ProviderErrorCode
} from "~provider/errors"
import { fetchSSE } from "~utils/fetch-sse"
import { Provider, SummarizeParams } from ".."

async function request(
  token: string,
  method: string,
  path: string,
  data?: unknown
) {
  return fetch(`https://chat.openai.com/backend-api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: data === undefined ? undefined : JSON.stringify(data)
  }).catch((err) => {
    if (err instanceof TypeError) {
      throw new ProviderError(
        "Network error, please check your network.",
        ProviderErrorCode.NETWORK_ERROR
      )
    } else {
      throw err
    }
  })
}

const KEY_ACCESS_TOKEN = "accessToken"

const cache = new ExpiryMap(10 * 1000)

export async function getChatGPTAccessToken(): Promise<string> {
  if (cache.get(KEY_ACCESS_TOKEN)) {
    return cache.get(KEY_ACCESS_TOKEN)
  }
  const resp = await fetch("https://chat.openai.com/api/auth/session").catch(
    (err) => {
      if (err instanceof TypeError) {
        throw new ProviderError(
          "Network error, please check your network.",
          ProviderErrorCode.NETWORK_ERROR
        )
      } else {
        throw err
      }
    }
  )
  if (resp.status === 403) {
    throw new ProviderError(
      "You have to pass Cloudflare check",
      ProviderErrorCode.CHATGPT_CLOUDFLARE
    )
  }
  const data = await resp.json().catch(() => ({}))
  if (!data.accessToken) {
    throw new ProviderError(
      "Unauthorized",
      ProviderErrorCode.CHATGPT_UNAUTHORIZED
    )
  }
  cache.set(KEY_ACCESS_TOKEN, data.accessToken)
  return data.accessToken
}

export async function setConversationProperty(
  token: string,
  conversationId: string,
  propertyObject: object
) {
  await request(
    token,
    "PATCH",
    `/conversation/${conversationId}`,
    propertyObject
  )
}

export class ChatGPTWebAppProvider extends Provider {
  #token: string
  #config: ChatGPTWebAppProviderConfig

  constructor(
    prompt: string,
    token: string,
    config: ChatGPTWebAppProviderConfig
  ) {
    super(prompt)
    this.#token = token
    this.#config = config
  }

  private async fetchModels(): Promise<
    { slug: string; title: string; description: string; max_tokens: number }[]
  > {
    const resp = await request(this.#token, "GET", "/models").then((r) =>
      r.json()
    )
    return resp.models
  }

  private async getModelName(): Promise<string> {
    try {
      const models = await this.fetchModels()
      return models[0].slug
    } catch (err) {
      console.error(err)
      return "text-davinci-002-render"
    }
  }

  async doSummarize(text: string, params: SummarizeParams) {
    let conversationId: string | undefined

    const cleanup = this.#config.cleanup
      ? () => {
          if (conversationId) {
            setConversationProperty(this.#token, conversationId, {
              is_visible: false
            })
          }
        }
      : () => {}

    const modelName = await this.getModelName()

    try {
      let result = ""

      await fetchSSE("https://chat.openai.com/backend-api/conversation", {
        method: "POST",
        signal: params.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.#token}`
        },
        body: JSON.stringify({
          action: "next",
          messages: [
            {
              id: uuidv4(),
              role: "user",
              content: {
                content_type: "text",
                parts: [text]
              }
            }
          ],
          model: modelName,
          parent_message_id: uuidv4()
        }),
        onMessage(message: string) {
          if (message === "[DONE]") {
            params.onFinish(result)
            cleanup()
            return
          }
          let data
          try {
            data = JSON.parse(message)
          } catch (err) {
            console.error(err)
            return
          }
          const resp = data.message?.content?.parts?.[0]
          if (resp) {
            conversationId = data.conversation_id
            result = resp
            params.onResult(resp)
          }
        }
      })
    } catch (err) {
      if (err instanceof ProviderBackendError) {
        throw new ProviderError(
          err.backendError?.detail?.message,
          ProviderErrorCode.BACKEND_ERROR
        )
      } else {
        throw err
      }
    }

    return { cleanup }
  }
}
