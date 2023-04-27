import { ChatGPTHomeUrl } from "~constants"
import { proxyFetch } from "~utils/proxy-fetch"
import { MessageNames, type RequestInitSubset } from "~/messaging"

export interface Requester {
  fetch(url: string, options?: RequestInitSubset): Promise<Response>
}

class GlobalFetchRequester implements Requester {
  fetch(url: string, options?: RequestInitSubset) {
    return fetch(url, options)
  }
}

class ProxyFetchRequester implements Requester {
  async findExistingProxyTab() {
    const tabs = await chrome.tabs.query({ pinned: true })
    const results: (string | undefined)[] = await Promise.all(
      tabs.map(async (tab) => {
        if (tab.url) {
          return tab.url
        }
        return chrome.tabs.sendMessage(tab.id!, "url").catch(() => undefined)
      })
    )
    for (let i = 0; i < results.length; i++) {
      if (results[i]?.startsWith(ChatGPTHomeUrl)) {
        return tabs[i]
      }
    }
  }

  waitForProxyTabReady(onReady: (tab: chrome.tabs.Tab) => void) {
    chrome.runtime.onMessage.addListener(async function listener(
      message,
      sender
    ) {
      if (message.name === MessageNames.ProxyTabReady) {
        chrome.runtime.onMessage.removeListener(listener)
        onReady(sender.tab!)
      }
    })
  }

  async createProxyTab() {
    return new Promise<chrome.tabs.Tab>((resolve) => {
      this.waitForProxyTabReady(resolve)
      chrome.tabs.create({ url: ChatGPTHomeUrl, pinned: true })
    })
  }

  async getProxyTab() {
    let tab = await this.findExistingProxyTab()
    if (!tab) {
      tab = await this.createProxyTab()
    }
    return tab
  }

  async refreshProxyTab() {
    const tab = await this.findExistingProxyTab()
    if (!tab) {
      await this.createProxyTab()
      return
    }
    return new Promise<chrome.tabs.Tab>((resolve) => {
      this.waitForProxyTabReady(resolve)
      chrome.tabs.reload(tab.id!)
    })
  }

  async fetch(url: string, options?: RequestInitSubset) {
    const tab = await this.getProxyTab()
    const resp = await proxyFetch(tab.id!, url, options)
    if (resp.status === 403) {
      await this.refreshProxyTab()
      return proxyFetch(tab.id!, url, options)
    }
    return resp
  }
}

export const globalFetchRequester = new GlobalFetchRequester()
export const proxyFetchRequester = new ProxyFetchRequester()
