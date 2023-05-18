import { v4 as uuidv4 } from "uuid"
import { Prompt } from "~config"
import type { ChatGPTWebAppProviderConfig } from "~config/provider"
import {
  ProviderBackendError,
  ProviderError,
  ProviderErrorCode
} from "~provider/errors"
import { parseSSEResponse } from "~utils/sse"
import { Provider, type SummarizeParams } from ".."
import { chatGPTWebAppClient } from "./client"

interface ConversationContext {
  conversationId: string
  lastMessageId: string
}

export class ChatGPTWebAppProvider extends Provider {
  #accessToken?: string
  #config: ChatGPTWebAppProviderConfig
  #conversationContext?: ConversationContext
  #cachedModelNames?: string[]

  constructor(prompt: Prompt, config: ChatGPTWebAppProviderConfig) {
    super(prompt)
    this.#config = config
  }

  private async fetchModelNames(): Promise<string[]> {
    if (this.#cachedModelNames) {
      return this.#cachedModelNames
    }
    const resp = await chatGPTWebAppClient.getModels(this.#accessToken!)
    this.#cachedModelNames = resp
      .map((r) => r.slug)
      .filter((slug) => !slug.includes("plugins"))
    return this.#cachedModelNames
  }

  private async getModelName(): Promise<string> {
    try {
      const modelNames = await this.fetchModelNames()
      return modelNames[0]
    } catch (err) {
      console.error(err)
      return "text-davinci-002-render"
    }
  }

  async doSummarize(text: string, params: SummarizeParams) {
    const cleanup = this.#config.cleanup
      ? () => {
          if (this.#conversationContext) {
            chatGPTWebAppClient.setConversationProperty(
              this.#accessToken,
              this.#conversationContext.conversationId,
              {
                is_visible: false
              }
            )
          }
        }
      : () => {}

    let loadingMsg = "Connecting to ChatGPT WebApp..."
    params.onLoading(loadingMsg)

    if (!this.#accessToken) {
      this.#accessToken = await chatGPTWebAppClient.getAccessToken()
    }
    const modelName = await this.getModelName()

    try {
      let result = ""
      this.resetConversation()
      const resp = await chatGPTWebAppClient
        .fetch("https://chat.openai.com/backend-api/conversation", {
          method: "POST",
          signal: params.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.#accessToken}`
          },
          body: JSON.stringify({
            action: "next",
            messages: [
              {
                id: uuidv4(),
                author: { role: "user" },
                content: {
                  content_type: "text",
                  parts: [text]
                }
              }
            ],
            model: modelName,
            conversation_id:
              this.#conversationContext?.conversationId || undefined,
            parent_message_id:
              this.#conversationContext?.lastMessageId || uuidv4()
          })
        })
        .catch((err) => {
          if (err instanceof TypeError) {
            throw new ProviderError(
              "Network error, please check your network.",
              ProviderErrorCode.NETWORK_ERROR
            )
          } else {
            throw err
          }
        })
      await parseSSEResponse(resp, (message: string) => {
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
          this.#conversationContext = {
            conversationId: data.conversation_id,
            lastMessageId: data.message.id
          }
          result = resp
          params.onResult(resp)
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

  resetConversation() {
    this.#conversationContext = undefined
  }
}
