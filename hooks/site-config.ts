import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { useEffect, useMemo, useState } from "react"
import {
  ConfigKeys,
  getHostConfigKey,
  getHostItemKey,
  getPageConfigKey,
  getPageItemKey,
  HostListConfigKey,
  Mode,
  PageListConfigKey,
  SiteStatus,
  SourceTextConfig
} from "~config"
import { useDefaultSourceTextConfig } from "./default-source-text-config"

export type EnabledType = {
  isManually: boolean
  isPage: boolean
}

export type ConfigType = {
  type: "Page" | "Host" | "Default"
  parentType: "Host" | "Default" | "None"
}

export function useSiteConfig(url?: string) {
  const [enabled, setEnabled] = useState<boolean>()
  const [enabledType, setEnabledType] = useState<EnabledType>()

  const [mode] = useStorage(ConfigKeys.mode)
  const [pages, setPages] = useStorage<{ [k: string]: SiteStatus }>(
    PageListConfigKey
  )
  const [hosts, setHosts] = useStorage<{ [k: string]: SiteStatus }>(
    HostListConfigKey
  )

  const pageKey = useMemo(() => {
    if (url === undefined) {
      return undefined
    }
    return getPageItemKey(url, true)
  }, [url])

  const hostKey = useMemo(() => {
    if (url === undefined) {
      return undefined
    }
    return getHostItemKey(url, true)
  }, [url])

  useEffect(() => {
    function updateEnabled() {
      if (pageKey === undefined || hostKey === undefined) {
        return
      }
      if (mode === Mode.Active) {
        let manuallyDisabled = false
        let isPage = false
        if (pages && pages[pageKey]) {
          if (pages[pageKey] === SiteStatus.Disabled) {
            manuallyDisabled = true
            isPage = true
          }
        }

        if (hosts && hosts[hostKey]) {
          if (hosts[hostKey] === SiteStatus.Disabled) {
            manuallyDisabled = true
            isPage = false
          }
        }
        setEnabledType({ isManually: manuallyDisabled, isPage })
        setEnabled(!manuallyDisabled)
      } else {
        let manuallyEnabled = false
        let isPage = false
        if (pages && pages[pageKey]) {
          if (pages[pageKey] === SiteStatus.Enabled) {
            manuallyEnabled = true
            isPage = true
          }
        }

        if (hosts && hosts[hostKey]) {
          if (hosts[hostKey] === SiteStatus.Enabled) {
            manuallyEnabled = true
            isPage = false
          }
        }
        setEnabledType({ isManually: manuallyEnabled, isPage })
        setEnabled(manuallyEnabled)
      }
    }

    updateEnabled()
  }, [mode, pages, hosts, pageKey, hostKey])

  const [effectiveConfig, setEffectiveConfig] = useState<SourceTextConfig>()
  const [effectiveConfigType, setEffectiveConfigType] = useState<ConfigType>()

  const [defaultConfig] = useDefaultSourceTextConfig()
  const [pageConfig, setPageConfig] = useState<SourceTextConfig>()
  const [hostConfig, setHostConfig] = useState<SourceTextConfig>()
  const pageConfigKey = useMemo(() => {
    if (url === undefined) {
      return undefined
    }
    return getPageConfigKey(url, true)
  }, [url])

  const hostConfigKey = useMemo(() => {
    if (url === undefined) {
      return undefined
    }
    return getHostConfigKey(url, true)
  }, [url])

  useEffect(() => {
    if (pageConfigKey) {
      ;(async () => {
        const storage = new Storage()
        setPageConfig(await storage.get(pageConfigKey))
        storage.watch({
          [pageConfigKey]: (c) => {
            setPageConfig(c.newValue)
          }
        })
      })()
    }
  }, [pageConfigKey])

  useEffect(() => {
    ;(async () => {
      if (hostConfigKey) {
        const storage = new Storage()
        setHostConfig(await storage.get(hostConfigKey))
        storage.watch({
          [hostConfigKey]: (c) => {
            setHostConfig(c.newValue)
          }
        })
      }
    })()
  }, [hostConfigKey])

  useEffect(() => {
    function updateEffectiveConfig() {
      if (pageConfig) {
        setEffectiveConfigType({
          type: "Page",
          parentType: hostConfig ? "Host" : "Default"
        })
        setEffectiveConfig(pageConfig)
        return
      }
      if (hostConfig) {
        setEffectiveConfigType({
          type: "Host",
          parentType: "Default"
        })
        setEffectiveConfig(hostConfig)
        return
      }

      if (defaultConfig) {
        setEffectiveConfigType({
          type: "Default",
          parentType: "None"
        })
        setEffectiveConfig(defaultConfig)
      }
    }

    updateEffectiveConfig()
  }, [pageConfig, hostConfig, defaultConfig])

  function toggleEnabled(isPage: boolean, isManually: boolean) {
    if (isPage) {
      let newPages = { ...pages }
      if (isManually) {
        newPages[pageKey] =
          mode === Mode.Active ? SiteStatus.Disabled : SiteStatus.Enabled
      } else {
        newPages[pageKey] = SiteStatus.Default
      }

      setPages(newPages)
    } else {
      let newHosts = { ...hosts }
      if (isManually) {
        newHosts[hostKey] =
          mode === Mode.Active ? SiteStatus.Disabled : SiteStatus.Enabled
      } else {
        newHosts[hostKey] = SiteStatus.Default
      }

      setHosts(newHosts)
    }
  }

  function saveConfig(dest: "host" | "page", newConfig: SourceTextConfig) {
    const storage = new Storage()
    if (dest === "page") {
      storage.set(pageConfigKey, newConfig)
    } else {
      storage.set(hostConfigKey, newConfig)
      storage.remove(pageConfigKey)
    }
  }

  function restoreConfig(configType: ConfigType) {
    const storage = new Storage()
    if (configType.type === "Page") {
      storage.remove(pageConfigKey)
    } else if (configType.type === "Host") {
      storage.remove(hostConfigKey)
    }
  }

  return {
    mode,
    enabled,
    enabledType,
    effectiveConfig,
    effectiveConfigType,
    toggleEnabled,
    saveConfig,
    restoreConfig
  } as const
}
