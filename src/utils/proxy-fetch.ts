import {
  type ProxyFetchRequestMessage,
  type ProxyFetchResponseBodyChunkMessage,
  type ProxyFetchResponseMetadataMessage,
  type RequestInitSubset
} from "~/messaging"
import { v4 as uuid } from "uuid"
import { string2Uint8Array, uint8Array2String } from "~utils/encoding"
import { streamAsyncIterable } from "~utils/stream-async-iterable"
import { MessageNames } from "~messaging"

export function setupProxyExecutor() {
  chrome.runtime.onConnect.addListener((port) => {
    const abortController = new AbortController()
    port.onDisconnect.addListener(() => {
      abortController.abort()
    })
    port.onMessage.addListener(async (message: ProxyFetchRequestMessage) => {
      const resp = await fetch(message.url, {
        ...message.options,
        signal: abortController.signal
      })
      port.postMessage({
        name: MessageNames.ProxyResponseMetadata,
        metadata: {
          status: resp.status,
          statusText: resp.statusText,
          headers: Object.fromEntries(resp.headers.entries())
        }
      } as ProxyFetchResponseMetadataMessage)
      for await (const chunk of streamAsyncIterable(resp.body!)) {
        port.postMessage({
          name: MessageNames.ProxyResponseBodyChunk,
          value: uint8Array2String(chunk),
          done: false
        } as ProxyFetchResponseBodyChunkMessage)
      }
      port.postMessage({
        name: MessageNames.ProxyResponseBodyChunk,
        done: true
      } as ProxyFetchResponseBodyChunkMessage)
    })
  })
}

export async function proxyFetch(
  tabId: number,
  url: string,
  options?: RequestInitSubset
): Promise<Response> {
  return new Promise((resolve) => {
    const port = chrome.tabs.connect(tabId, { name: uuid() })
    port.onDisconnect.addListener(() => {
      throw new DOMException("proxy fetch aborted", "AbortError")
    })
    options?.signal?.addEventListener("abort", () => port.disconnect())
    const body = new ReadableStream({
      start(controller) {
        port.onMessage.addListener(function onMessage(message) {
          if (message.name === MessageNames.ProxyResponseMetadata) {
            const response = new Response(body, message.metadata)
            resolve(response)
          } else if (message.name === MessageNames.ProxyResponseBodyChunk) {
            if (message.done) {
              controller.close()
              port.onMessage.removeListener(onMessage)
              port.disconnect()
            } else {
              const chunk = string2Uint8Array(message.value)
              controller.enqueue(chunk)
            }
          }
        })
        port.postMessage({ url, options } as ProxyFetchRequestMessage)
      },
      cancel(_reason: string) {
        port.disconnect()
      }
    })
  })
}
