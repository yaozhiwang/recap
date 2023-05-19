import type { PlasmoCSConfig } from "plasmo"
import { MessageNames } from "~messaging"
import { setupProxyExecutor } from "~utils/proxy-fetch"

export const config: PlasmoCSConfig = {
  matches: ["https://chat.openai.com/*"]
}

async function main() {
  chrome.runtime.onMessage.addListener(
    async (message, sender, sendResponse) => {
      if (message === MessageNames.QueryUrl) {
        sendResponse(location.href)
      }
    }
  )
  if ((window as any).__NEXT_DATA__) {
    await chrome.runtime.sendMessage({ name: MessageNames.ProxyTabReady })
  }
}

setupProxyExecutor()
main().catch(console.error)
