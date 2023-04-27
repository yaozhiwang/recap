import { MessageNames } from "~messaging"
import { setupProxyExecutor } from "~utils/proxy-fetch"

function injectTip() {
  const div = document.createElement("div")
  div.innerText = "Please keep this tab open, now you can go back"
  div.style.position = "fixed"
  // put the div at right top of page
  div.style.top = "0"
  div.style.right = "0"
  div.style.zIndex = "50"
  div.style.padding = "10px"
  div.style.margin = "10px"
  div.style.border = "1px solid"
  document.body.appendChild(div)
}

async function main() {
  chrome.runtime.onMessage.addListener(async (message) => {
    if (message === "url") {
      return location.href
    }
  })
  if ((window as any).__NEXT_DATA__) {
    await chrome.runtime.sendMessage({ name: MessageNames.ProxyTabReady })
    injectTip()
  }
}

setupProxyExecutor()
main().catch(console.error)

export {}
