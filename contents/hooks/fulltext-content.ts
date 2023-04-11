import { useEffect, useState } from "react"
import { useSiteConfigWithPreview } from "~hooks"
import { getInnerText } from "~utils/dom"
import { useFullTextContainer } from "./fulltext-container"

export function useFullTextContent(url: string) {
  const [content, setContent] = useState("")

  const { enabled, enabledDetails, config } = useSiteConfigWithPreview(url)
  const [fullTextContainer] = useFullTextContainer(config)

  useEffect(() => {
    ;(async () => {
      if (enabled && config && fullTextContainer) {
        let content = ""
        for (const node of document.querySelectorAll(fullTextContainer)) {
          content += getInnerText(node, false, config.excludeContainers)
        }
        setContent(content)
      }
    })()
  }, [fullTextContainer, enabled, config])

  return { enabled, enabledDetails, content } as const
}
