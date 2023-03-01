export function getExtensionVersion() {
  return chrome.runtime.getManifest().version
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ")
}

export function tagDisplayName(tag: string) {
  return `<${tag}>`
}
