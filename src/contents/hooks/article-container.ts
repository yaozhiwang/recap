import { useEffect, useState } from "react"
import type { SourceTextConfig } from "~config"

export function useArticleContainers(config: SourceTextConfig) {
  const [containers, setContainers] = useState<
    NodeListOf<Element> | HTMLElement[]
  >()

  useEffect(() => {
    ;(async () => {
      if (config) {
        setContainers(await findArticleContainers(config))
      }
    })()
  }, [config])

  return [containers] as const
}

async function findArticleContainers(config: SourceTextConfig) {
  for (const container of config.articleContainers) {
    const articles = document.querySelectorAll(container)
    if (articles.length > 1) {
      return articles
    } else if (articles.length === 1) {
      // single article page
      return [document.body]
    }
  }
  return [document.body]
}
