import type { OpenAIProviderConfig } from "~/config/provider"
import {
  ProviderBackendError,
  ProviderError,
  ProviderErrorCode
} from "~provider/errors"
import { Provider, type SummarizeParams } from ".."
import { fetchSSE } from "../../utils/fetch-sse"

export class OpenAIChatProvider extends Provider {
  #config: OpenAIProviderConfig

  constructor(prompt: string, config: OpenAIProviderConfig) {
    super(prompt)
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

    params.onLoading("connecting to OpenAI...")
    try {
      await fetchSSE("https://api.openai.com/v1/chat/completions", {
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
        }),
        onMessage(message) {
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
}
