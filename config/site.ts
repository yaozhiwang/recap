import { Storage } from "@plasmohq/storage"
import normalizeUrl from "normalize-url"
import { ConfigKeys, Mode } from "~config"

export enum SiteStatus {
  Default = "default",
  Enabled = "enabled",
  Disabled = "disabled"
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

const defaultDisabledSites = [
  "google.com",
  "github.com",
  "bing.com",
  "chat.openai.com"
]

export async function saveDefaultSiteConfigs() {
  const storage = new Storage()

  let hosts = await storage.get<{ [k: string]: SiteStatus }>(HostListConfigKey)
  if (hosts === undefined) {
    hosts = {}
  }
  defaultDisabledSites.forEach((site) => {
    const key = getHostItemKey(site, false)
    if (hosts[key] === undefined) {
      hosts[key] = SiteStatus.Disabled
    }
  })
  await storage.set(HostListConfigKey, hosts)
}

export async function toggleEnable(url: string) {
  const storage = new Storage()

  const mode = await storage.get(ConfigKeys.mode)
  let pages = await storage.get<{}>(PageListConfigKey)
  if (pages === undefined) {
    pages = {}
  }
  const pageKey = getPageItemKey(url, false)
  if (pages[pageKey] === undefined || pages[pageKey] === SiteStatus.Default) {
    pages[pageKey] =
      mode === Mode.Active ? SiteStatus.Disabled : SiteStatus.Enabled
  } else {
    pages[pageKey] = SiteStatus.Default
  }
  await storage.set(PageListConfigKey, pages)
}
