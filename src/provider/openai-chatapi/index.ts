import { isEmpty } from "lodash-es"
import type { OpenAIProviderConfig } from "~/config/provider"
import {
  ProviderBackendError,
  ProviderError,
  ProviderErrorCode
} from "~provider/errors"
import { parseSSEResponse } from "~utils/sse"
import { Provider, type SummarizeParams } from ".."

export class OpenAIChatProvider extends Provider {
  #config: OpenAIProviderConfig

  constructor(config: OpenAIProviderConfig) {
    super()
    this.#config = config
  }

  private buildPrompt(text: string): Array<any> {
    return [{ role: "user", content: text }]
  }

  async doSummarize(
    text: string,
    params: SummarizeParams
  ): Promise<{ cleanup?: () => void }> {
    let result = ""
    if (this.#config.apiKey === "") {
      throw new ProviderError(
        "Please set API key in options page.",
        ProviderErrorCode.API_KEY_NOT_SET
      )
    }

    params.onLoading("Connecting to OpenAI...")
    try {
      const resp = await fetch(`${this.#config.apiHost}/v1/chat/completions`, {
        method: "POST",
        signal: params.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.#config.apiKey}`
        },
        body: JSON.stringify({
          model: this.#config.model,
          messages: this.buildPrompt(text),
          // max_tokens: this.#config.max_tokens,
          temperature: this.#config.temperature,
          top_p: this.#config.top_p,
          stream: true
        })
      }).catch((err) => {
        if (err instanceof TypeError) {
          throw new ProviderError(
            "Network error, please check your network or API host setting.",
            ProviderErrorCode.NETWORK_ERROR
          )
        } else {
          throw err
        }
      })

      await parseSSEResponse(resp, (message) => {
        if (message === "[DONE]") {
          params.onFinish(result)
          return
        }

        try {
          const response = JSON.parse(message)
          if (response?.choices[0]?.finish_reason) {
            return
          }
          const text = response?.choices[0]?.delta?.content
          if (text) {
            result += text
            params.onResult(result)
          }
        } catch (err) {
          console.error(err)
          return
        }
      })
    } catch (err) {
      if (err instanceof ProviderBackendError) {
        throw new ProviderError(
          err.backendError?.error?.message,
          ProviderErrorCode.BACKEND_ERROR
        )
      } else {
        throw err
      }
    }
    return {}
  }

  async fetchModels(): Promise<string[]> {
    const resp = await fetch(`${this.#config.apiHost}/v1/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.#config.apiKey}`
      }
    })
    if (!resp.ok) {
      const error = await resp.json().catch(() => ({}))
      if (isEmpty(error)) {
        throw new ProviderError(
          `${resp.status} ${resp.statusText}`,
          ProviderErrorCode.REQUEST_ERROR
        )
      } else {
        throw new ProviderBackendError(error)
      }
    }
    const data = await resp.json().catch(() => {})

    // https://platform.openai.com/docs/models/model-endpoint-compatibility
    const chatModels = []
    for (const model of data.data) {
      if (
        model.id.startsWith("gpt-3.5-turbo") ||
        model.id.startsWith("gpt-4")
      ) {
        chatModels.push(model.id)
      }
    }
    return chatModels
  }
}
