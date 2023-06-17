import { type RequestInitSubset } from "~/messaging"
import {
  globalFetchRequester,
  proxyFetchRequester,
  type Requester
} from "./requesters"
import { ProviderError, ProviderErrorCode } from "~provider/errors"

class ChatGPTWebAppClient {
  requester: Requester

  constructor() {
    this.requester = globalFetchRequester
    proxyFetchRequester.findExistingProxyTab().then((tab) => {
      if (tab) {
        this.switchRequester(proxyFetchRequester)
      }
    })
  }

  switchRequester(newRequester: Requester) {
    this.requester = newRequester
  }

  async fetch(url: string, options?: RequestInitSubset): Promise<Response> {
    return this.requester.fetch(url, options)
  }

  async getAccessToken(): Promise<string> {
    const resp = await this.fetch(
      "https://chat.openai.com/api/auth/session"
    ).catch((err) => {
      if (err instanceof TypeError) {
        throw new ProviderError(
          "Network error, please check your network.",
          ProviderErrorCode.NETWORK_ERROR
        )
      } else {
        throw err
      }
    })
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
    return data.accessToken
  }

  private async requestBackendAPIWithToken(
    token: string,
    method: string,
    path: string,
    data?: unknown
  ) {
    const resp = await this.fetch(
      `https://chat.openai.com/backend-api${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: data === undefined ? undefined : JSON.stringify(data)
      }
    ).catch((err) => {
      if (err instanceof TypeError) {
        throw new ProviderError(
          "Network error, please check your network.",
          ProviderErrorCode.NETWORK_ERROR
        )
      } else {
        throw err
      }
    })
    if (resp.status === 403) {
      throw new ProviderError(
        "You have to pass Cloudflare check",
        ProviderErrorCode.CHATGPT_CLOUDFLARE
      )
    }
    return resp
  }

  async fetchModels(
    token: string
  ): Promise<
    { slug: string; title: string; description: string; max_tokens: number }[]
  > {
    const resp = await this.requestBackendAPIWithToken(
      token,
      "GET",
      "/models"
    ).then((r) => r.json())
    return resp.models
  }

  async fixAuthState() {
    if (this.requester === proxyFetchRequester) {
      await proxyFetchRequester.refreshProxyTab()
    } else {
      await proxyFetchRequester.getProxyTab()
      this.switchRequester(proxyFetchRequester)
    }
  }

  setConversationProperty(
    token: string,
    conversationId: string,
    propertyObject: object
  ) {
    this.requestBackendAPIWithToken(
      token,
      "PATCH",
      `/conversation/${conversationId}`,
      propertyObject
    )
  }
}

export const chatGPTWebAppClient = new ChatGPTWebAppClient()
