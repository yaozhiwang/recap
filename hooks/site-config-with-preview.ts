import { useStorage } from "@plasmohq/storage/hook"
import { useEffect, useState } from "react"
import type { SourceTextConfig } from "~config"
import { PreviewConfigKey } from "~constants"
import { useSiteConfig } from "./site-config"

export function useSiteConfigWithPreview(url: string) {
  const [config, setConfig] = useState<SourceTextConfig>()

  const { enabled, effectiveConfig } = useSiteConfig(url)
  const [previewConfig] = useStorage<SourceTextConfig>(PreviewConfigKey)

  useEffect(() => {
    if (previewConfig) {
      setConfig(previewConfig)
      return
    }
    if (effectiveConfig) {
      setConfig(effectiveConfig)
    }
  }, [previewConfig, effectiveConfig])

  return {
    enabled,
    config
  } as const
}
