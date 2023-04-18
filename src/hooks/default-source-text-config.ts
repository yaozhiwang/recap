import { useStorage } from "@plasmohq/storage/hook"
import { useMemo } from "react"
import { ConfigKeys, type SourceTextConfig } from "~config"

export function useDefaultSourceTextConfig() {
  const [defaultArticleContainer] = useStorage(ConfigKeys.articleContainers)
  const [defaultExcludeContainers] = useStorage(ConfigKeys.excludeContainers)
  const [defaultHeadingAnchor] = useStorage(ConfigKeys.headingAnchor)

  const defaultConfig = useMemo<SourceTextConfig>(() => {
    if (
      defaultArticleContainer === undefined ||
      defaultExcludeContainers === undefined ||
      defaultHeadingAnchor === undefined
    ) {
      return undefined
    }

    return {
      articleContainers: defaultArticleContainer,
      excludeContainers: defaultExcludeContainers,
      headingAnchor: defaultHeadingAnchor
    }
  }, [defaultArticleContainer, defaultExcludeContainers, defaultHeadingAnchor])

  return [defaultConfig] as const
}
