import { useEffect, useState } from "react"

export function useOptionsUrl() {
  const [optionsUrl, setOptionsUrl] = useState<string>()

  useEffect(() => {
    setOptionsUrl(chrome.runtime.getURL("/options.html"))
  }, [])

  return [optionsUrl] as const
}
