import { useState } from "react"
import { PortNames } from "~messaging"

export enum SummaryStatus {
  Loading = "loading",
  Generating = "generating",
  Finish = "finish",
  Error = "error"
}

export function isRunningStatus(status: SummaryStatus) {
  return status === SummaryStatus.Loading || status === SummaryStatus.Generating
}

export function isDoneStatus(status: SummaryStatus) {
  return status === SummaryStatus.Finish || status === SummaryStatus.Error
}

export class SummaryContent {
  status: SummaryStatus
  data: any
}

export function useSummaryContent() {
  let port: chrome.runtime.Port = null
  const [summary, setSummary] = useState<SummaryContent>(null)

  const listener = (msg: any) => {
    if (msg.result) {
      setSummary({ status: SummaryStatus.Generating, data: msg.result })
    } else if (msg.error) {
      setSummary({ status: SummaryStatus.Error, data: msg.error })
      cleanup()
    } else if (msg.finish) {
      setSummary({ status: SummaryStatus.Finish, data: msg.finish })
      cleanup()
    } else if (msg.loading) {
      setSummary({
        status: SummaryStatus.Loading,
        data: { message: msg.loading }
      })
    }
  }

  function start(content: string) {
    port = chrome.runtime.connect({
      name: PortNames.Summarize
    })
    port.onMessage.addListener(listener)
    port.postMessage({ content })
  }

  function cleanup() {
    if (port) {
      port.onMessage.removeListener(listener)
      port.disconnect()
      port = null
    }
  }

  return [summary, start] as const
}
