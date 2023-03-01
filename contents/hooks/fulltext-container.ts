import { useEffect, useState } from "react"
import type { SourceTextConfig } from "~config"

export function useFullTextContainer(config: SourceTextConfig) {
  const [container, setContainer] = useState<string>()

  useEffect(() => {
    ;(async () => {
      if (config) {
        setContainer(await findFullTextContainer(config))
      }
    })()
  })

  return [container] as const
}

async function findFullTextContainer(config: SourceTextConfig) {
  for (const container of config.fullTextContainers) {
    if (document.querySelector(container)) {
      return container
    }
  }
  return ""
}
