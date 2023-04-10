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

export type EnabledReason = {
  isManually: boolean
  isPage: boolean
  forcePage: boolean
}

export type EnabledDetails = {
  pageEnabled: boolean
  hostEnabled: boolean
}

export type ConfigType = {
  type: "Page" | "Host" | "Default"
  parentType: "Host" | "Default" | "None"
}

export function useSiteConfig(url?: string) {
  const [enabled, setEnabled] = useState<boolean>()
  const [enabledReason, setEnabledReason] = useState<EnabledReason>()
  const [enabledDetails, setEnabledDetails] = useState<EnabledDetails>()

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
        let forceEnabled = false
        if (pages && pages[pageKey]) {
          if (pages[pageKey] === SiteStatus.Disabled) {
            manuallyDisabled = true
            isPage = true
          } else if (pages[pageKey] === SiteStatus.ForceEnabled) {
            forceEnabled = true
          }
        }

        if (hosts && hosts[hostKey] === SiteStatus.Disabled) {
          manuallyDisabled = true
          isPage = false
        }

        setEnabledReason({
          isManually: manuallyDisabled,
          isPage,
          forcePage: forceEnabled
        })
        setEnabled(forceEnabled || !manuallyDisabled)
      } else {
        let manuallyEnabled = false
        let isPage = false
        let forceDisabled = false
        if (pages && pages[pageKey]) {
          if (pages[pageKey] === SiteStatus.Enabled) {
            manuallyEnabled = true
            isPage = true
          } else if (pages[pageKey] === SiteStatus.ForceDisabled) {
            forceDisabled = true
          }
        }

        if (hosts && hosts[hostKey] === SiteStatus.Enabled) {
          manuallyEnabled = true
          isPage = false
        }

        setEnabledReason({
          isManually: manuallyEnabled,
          isPage,
          forcePage: forceDisabled
        })
        setEnabled(!forceDisabled && manuallyEnabled)
      }
    }

    updateEnabled()
  }, [mode, pages, hosts, pageKey, hostKey])

  useEffect(() => {
    function updateEnabledDetails() {
      if (pageKey === undefined || hostKey === undefined) {
        return
      }
      let pageEnabled = false
      let hostEnabled = false
      if (hosts === undefined || hosts[hostKey] === undefined) {
        hostEnabled = mode === Mode.Active
        if (
          pages &&
          (pages[pageKey] === SiteStatus.Enabled ||
            pages[pageKey] === SiteStatus.Disabled)
        ) {
          // manually set page
          pageEnabled = pages[pageKey] === SiteStatus.Enabled
        } else {
          pageEnabled = hostEnabled
        }
      } else {
        hostEnabled = hosts[hostKey] === SiteStatus.Enabled
        if (
          pages &&
          (pages[pageKey] === SiteStatus.ForceEnabled ||
            pages[pageKey] === SiteStatus.ForceDisabled)
        ) {
          // force page
          pageEnabled = pages[pageKey] === SiteStatus.ForceEnabled
        } else {
          pageEnabled = hostEnabled
        }
      }

      setEnabledDetails({ pageEnabled, hostEnabled })
    }

    updateEnabledDetails()
  }, [mode, pages, hosts, pageKey, hostKey])

  function toggleEnabled(isPage: boolean, isManually: boolean) {
    if (isPage) {
      let newPages = { ...pages }
      if (isManually) {
        newPages[pageKey] =
          mode === Mode.Active ? SiteStatus.Disabled : SiteStatus.Enabled
      } else {
        delete newPages[pageKey]
      }

      setPages(newPages)
    } else {
      let newHosts = { ...hosts }
      if (isManually) {
        newHosts[hostKey] =
          mode === Mode.Active ? SiteStatus.Disabled : SiteStatus.Enabled
      } else {
        delete newHosts[hostKey]
      }

      setHosts(newHosts)
    }
  }

  function toggleForcePageEnabled(forced: boolean) {
    let newPages = { ...pages }
    if (forced) {
      newPages[pageKey] =
        mode === Mode.Active
          ? SiteStatus.ForceEnabled
          : SiteStatus.ForceDisabled
    } else {
      delete newPages[pageKey]
    }

    setPages(newPages)
  }

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
    enabledReason,
    enabledDetails,
    effectiveConfig,
    effectiveConfigType,
    toggleEnabled,
    toggleForcePageEnabled,
    saveConfig,
    restoreConfig
  } as const
}
