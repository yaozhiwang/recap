import { random } from "lodash-es"
import { v4 as uuidv4 } from "uuid"
import { ChatGPTWebAppProviderConfig } from "~config/provider"
import {
  ProviderBackendError,
  ProviderError,
  ProviderErrorCode
} from "~provider/errors"
import { parseSSEResponse } from "~utils/sse"
import { Provider, type SummarizeParams } from ".."
import { chatGPTWebAppClient } from "./client"

function generateRandomHex(length: number) {
  let result = ""
  const characters = "0123456789abcdef"
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

function generateArkoseToken() {
  return `${generateRandomHex(
    17
  )}|r=ap-southeast-1|meta=3|meta_width=300|metabgclr=transparent|metaiconclr=%23555555|guitextcolor=%23000000|pk=35536E1E-65B4-4D96-9D97-6ADB7EFF8147|at=40|sup=1|rid=${random(
    1,
    99
  )}|ag=101|cdn_url=https%3A%2F%2Ftcr9i.chat.openai.com%2Fcdn%2Ffc|lurl=https%3A%2F%2Faudio-ap-southeast-1.arkoselabs.com|surl=https%3A%2F%2Ftcr9i.chat.openai.com|smurl=https%3A%2F%2Ftcr9i.chat.openai.com%2Fcdn%2Ffc%2Fassets%2Fstyle-manager`
}

interface ConversationContext {
  conversationId: string
  lastMessageId: string
}

export class ChatGPTWebAppProvider extends Provider {
  #accessToken?: string
  #config: ChatGPTWebAppProviderConfig
  #conversationContext?: ConversationContext

  constructor(config: ChatGPTWebAppProviderConfig) {
    super()
    this.#config = config
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
            model: this.#config.model,
            arkose_token: this.#config.model.startsWith("gpt-4")
              ? generateArkoseToken()
              : undefined,
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
        let data: any
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

  async fetchModels() {
    if (!this.#accessToken) {
      this.#accessToken = await chatGPTWebAppClient.getAccessToken()
    }
    const resp = await chatGPTWebAppClient.fetchModels(this.#accessToken!)
    return resp.map((r) => r.slug).filter((slug) => !slug.includes("plugins"))
  }
}
