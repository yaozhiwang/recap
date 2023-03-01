import { createParser } from "eventsource-parser"
import { isEmpty } from "lodash-es"
import {
  ProviderBackendError,
  ProviderError,
  ProviderErrorCode
} from "~provider/errors"
import { streamAsyncIterable } from "./stream-async-iterable"

export async function fetchSSE(
  resource: string,
  options: RequestInit & { onMessage: (message: string) => void }
) {
  const { onMessage, ...fetchOptions } = options
  const resp = await fetch(resource, fetchOptions)
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
  const parser = createParser((event) => {
    if (event.type === "event") {
      onMessage(event.data)
    }
  })
  for await (const chunk of streamAsyncIterable(resp.body!)) {
    const str = new TextDecoder().decode(chunk)
    parser.feed(str)
  }
}
