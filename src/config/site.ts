import { Storage } from "@plasmohq/storage"
import normalizeUrl from "normalize-url"
import { ConfigKeys, Mode } from "~config"

export enum SiteStatus {
  Enabled = "enabled",
  Disabled = "disabled",
  ForceEnabled = "force-enabled",
  ForceDisabled = "force-disabled"
}
export const HostListConfigKey = "hosts"
export const PageListConfigKey = "pages"
export function getHostItemKey(url: string, normalized: boolean) {
  return getHost(normalized ? url : urlNormalize(url))
}
export function getPageItemKey(url: string, normalized: boolean) {
  return normalized ? url : urlNormalize(url)
}

export interface SourceTextConfig {
  fullTextContainers: string[]
  excludeContainers: string[]
  headingAnchor: string
}
export const HostConfigKeyPrefix = "host."
export const PageConfigKeyPrefix = "page."
export function getHostConfigKey(url: string, normalized: boolean) {
  return HostConfigKeyPrefix + getHostItemKey(url, normalized)
}
export function getPageConfigKey(url: string, normalized: boolean) {
  return PageConfigKeyPrefix + getPageItemKey(url, normalized)
}
export function urlNormalize(url: string) {
  return normalizeUrl(url, {
    stripAuthentication: true,
    stripHash: true,
    stripProtocol: true,
    stripTextFragment: true,
    stripWWW: true,
    removeQueryParameters: true,
    removeTrailingSlash: true,
    removeSingleSlash: true,
    removeDirectoryIndex: false,
    removeExplicitPort: false
  })
}
function getHost(url: string) {
  return url.split("/")[0]
}

export async function saveDefaultSiteConfigs() {
  const storage = new Storage()

  for (const key of [HostListConfigKey, PageListConfigKey]) {
    if (undefined === (await storage.get(key))) {
      await storage.set(key, { dummy: SiteStatus.Enabled })
    }
  }
}

export async function toggleEnablePage(url: string) {
  const storage = new Storage()

  const mode = await storage.get(ConfigKeys.mode)
  let pages = await storage.get<{}>(PageListConfigKey)
  const pageKey = getPageItemKey(url, false)

  const hosts = await storage.get<{}>(HostListConfigKey)
  const hostKey = getHostItemKey(url, false)
  if (hosts[hostKey] === undefined) {
    if (pages[pageKey] === undefined) {
      pages[pageKey] =
        mode === Mode.Active ? SiteStatus.Disabled : SiteStatus.Enabled
    } else {
      delete pages[pageKey]
    }
  } else {
    if (pages[pageKey] === undefined) {
      pages[pageKey] =
        mode === Mode.Active
          ? SiteStatus.ForceEnabled
          : SiteStatus.ForceDisabled
    } else {
      delete pages[pageKey]
    }
  }
  await storage.set(PageListConfigKey, pages)
}

export async function toggleEnableHost(url: string) {
  const storage = new Storage()

  const mode = await storage.get(ConfigKeys.mode)
  const hosts = await storage.get<{}>(HostListConfigKey)
  const hostKey = getHostItemKey(url, false)
  if (hosts[hostKey] === undefined) {
    hosts[hostKey] =
      mode === Mode.Active ? SiteStatus.Disabled : SiteStatus.Enabled
  } else {
    delete hosts[hostKey]
  }
  await storage.set(HostListConfigKey, hosts)
}
