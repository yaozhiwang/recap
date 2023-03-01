import { useStorage } from "@plasmohq/storage/hook"
import { useMemo } from "react"
import { ConfigKeys, SourceTextConfig } from "~config"

export function useDefaultSourceTextConfig() {
  const [defaultFullTextContainer] = useStorage(ConfigKeys.fullTextContainers)
  const [defaultExcludeContainers] = useStorage(ConfigKeys.excludeContainers)
  const [defaultHeadingAnchor] = useStorage(ConfigKeys.headingAnchor)

  const defaultConfig = useMemo<SourceTextConfig>(() => {
    if (
      defaultFullTextContainer === undefined ||
      defaultExcludeContainers === undefined ||
      defaultHeadingAnchor === undefined
    ) {
      return undefined
    }

    return {
      fullTextContainers: defaultFullTextContainer,
      excludeContainers: defaultExcludeContainers,
      headingAnchor: defaultHeadingAnchor
    }
  }, [defaultFullTextContainer, defaultExcludeContainers, defaultHeadingAnchor])

  return [defaultConfig] as const
}
