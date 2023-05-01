import { Storage } from "@plasmohq/storage"
import {
  saveDefaultConfigs,
  toggleEnableHost,
  toggleEnablePage
} from "~/config"
import { ShortcutNames, isFirstCacheKey } from "~constants"
import { getLoadingActionIcon, getStatusActionIcon } from "./action-icon"
import { summarize } from "./summarize"
import { MessageNames, PortNames } from "~messaging"
import { chatGPTWebAppClient } from "~provider/chatgpt-webapp/client"

export {}

chrome.runtime.onInstalled.addListener(async (details) => {
  await saveDefaultConfigs()

  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    await new Storage({ area: "local" }).set(isFirstCacheKey, true)
    chrome.runtime.openOptionsPage()
  }
})

chrome.runtime.onStartup.addListener(async () => {
  await saveDefaultConfigs()
})

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: "recap-sum",
    title: "Summarize the selected text",
    type: "normal",
    contexts: ["selection"],
    documentUrlPatterns: ["http://*/*", "https://*/*"]
  })
})

chrome.contextMenus.onClicked.addListener((item, tab) => {
  chrome.tabs.sendMessage(tab.id, {
    name: MessageNames.SummarizeText,
    text: item.selectionText
  })
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    const imageData = await getLoadingActionIcon()
    if (imageData) {
      chrome.action.setIcon({ tabId, imageData })
    }
  }
})

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
      return
    }
    if (command === ShortcutNames.ToggleEnablePage) {
      toggleEnablePage(tab.url)
    } else if (command === ShortcutNames.ToggleEnableHost) {
      toggleEnableHost(tab.url)
    } else if (command === ShortcutNames.SummarizePage) {
      chrome.tabs.sendMessage(tab.id, { name: MessageNames.SummarizePage })
    }
  })
})

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === PortNames.Summarize) {
    port.onMessage.addListener(async (msg) => {
      if (!msg || msg.content === undefined) {
        port.postMessage({
          error: {
            code: "invalid_message",
            message: "invalid message received"
          }
        })
        return
      }
      if (msg.content === "") {
        port.postMessage({
          error: {
            code: "empty_content",
            message: "the content sent to summarize is empty",
            showBugReport: true
          }
        })
        return
      }
      try {
        await summarize(port, msg.content)
      } catch (error: any) {
        console.error(error)
        port.postMessage({
          error: { code: error.code, message: error.message }
        })
      }
    })
  }
})

chrome.runtime.onMessage.addListener(async function (
  msg,
  sender,
  sendResponse
) {
  if (msg.name == MessageNames.UpdateActionIcon) {
    const { pageEnabled, hostEnabled } = msg.enabledDetails

    chrome.action.setTitle({
      tabId: sender.tab.id,
      title: `Recap\nDomain: ${hostEnabled ? "Enabled" : "Disabled"}\nPage: ${
        pageEnabled ? "Enabled" : "Disabled"
      }\n`
    })

    const imageData = await getStatusActionIcon(pageEnabled, hostEnabled)
    if (imageData) {
      chrome.action.setIcon({ tabId: sender.tab.id, imageData })
    }
  } else if (msg.name === MessageNames.FixChatGPTWebAppAuthState) {
    await chatGPTWebAppClient.fixAuthState()
    sendResponse()
  }
})
