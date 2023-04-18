import { useEffect, useState } from "react"
import { useSiteConfigWithPreview } from "~hooks"
import { getInnerText, getTitle } from "~utils/dom"
import { useArticleContainers } from "./article-container"

interface ArticleContent {
  title: string
  content: string
}
interface PageContent {
  title: string
  articles: ArticleContent[]
}

export function usePageContent(url: string) {
  const [content, setContent] = useState<PageContent>()

  const { enabled, enabledDetails, config } = useSiteConfigWithPreview(url)
  const [articleContainers] = useArticleContainers(config)

  useEffect(() => {
    if (
      enabled === undefined ||
      config === undefined ||
      articleContainers === undefined
    ) {
      return
    }
    if (!enabled) {
      return
    }
    const content: PageContent = {
      title: "",
      articles: []
    }
    for (const container of articleContainers) {
      const article = {
        title: getTitle(container, config.excludeContainers),
        content: getInnerText(container, false, config.excludeContainers)
      }
      content.articles.push(article)
    }
    if (content.articles.length === 1) {
      content.title = content.articles[0].title
    } else if (content.articles.length > 1) {
      content.title = getTitle(document.body, config.excludeContainers)
    }
    setContent(content)
  }, [articleContainers, enabled, config])

  return { enabled, enabledDetails, content } as const
}
