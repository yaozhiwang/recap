import { ProviderError, ProviderErrorCode } from "./errors"

export interface SummarizeParams {
  onLoading: (msg: string) => void
  onResult: (result: string) => void
  onFinish: (result: string) => void
  onError: (error: ProviderError) => void
  signal?: AbortSignal
}

export abstract class Provider {
  #prompt: string
  constructor(prompt = "Summarize this text:") {
    this.#prompt = prompt.trim()
  }

  async summarize(
    text: string,
    params: SummarizeParams
  ): Promise<{ cleanup?: () => void }> {
    try {
      return await this.doSummarize(`${this.#prompt}\n\n${text}`, params)
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
}
