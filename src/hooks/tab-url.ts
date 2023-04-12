import { useEffect, useState } from "react"
import { urlNormalize } from "~/config"

export function useTabUrl() {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    ;(async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })

      if (tab) {
        if (tab.url.startsWith("http://") || tab.url.startsWith("https://")) {
          setUrl(urlNormalize(tab.url))
        } else {
          setUrl("")
        }
      }
    })()
  }, [])

  return [url] as const
}
