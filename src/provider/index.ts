import { getPromptText, Prompt } from "~config"
import { ProviderError, ProviderErrorCode } from "./errors"

export interface SummarizeParams {
  onLoading: (msg: string) => void
  onResult: (result: string) => void
  onFinish: (result: string) => void
  onError: (error: ProviderError) => void
  signal?: AbortSignal
}

export abstract class Provider {
  async summarize(
    prompt: Prompt,
    text: string,
    params: SummarizeParams
  ): Promise<{ cleanup?: () => void }> {
    try {
      prompt.params.content = text.trim()
      return await this.doSummarize(getPromptText(prompt), params)
    } catch (err) {
      console.error(err, JSON.stringify(err))
      if (err instanceof ProviderError) {
        params.onError(err)
      } else if (!params.signal?.aborted) {
        // ignore user abort exception
        params.onError(
          new ProviderError(
            (err as Error).message,
            ProviderErrorCode.UNKOWN_ERROR
          )
        )
      }
    }
  }

  abstract doSummarize(
    text: string,
    params: SummarizeParams
  ): Promise<{ cleanup?: () => void }>

  abstract fetchModels(): Promise<string[]>
}
