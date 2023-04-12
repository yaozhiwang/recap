import { Storage } from "@plasmohq/storage"
import {
  ActionIconType,
  getStatusKey,
  type ActionIconData
} from "~utils/action-icon"

const actionIconCache = {}

async function loadActionIcons() {
  const actionIcons = await new Storage({ area: "local" }).get("actionIcons")
  if (actionIcons === undefined) {
    return false
  }

  let actionIcon = actionIcons[ActionIconType.Loading]
  if (actionIcon) {
    actionIconCache[ActionIconType.Loading] = {}
    for (let size in actionIcon) {
      actionIconCache[ActionIconType.Loading][size] = getImageData(
        actionIcon[size]
      )
    }
  }

  actionIcon = actionIcons[ActionIconType.Status]
  if (actionIcon) {
    actionIconCache[ActionIconType.Status] = {}
    for (let key in actionIcon) {
      actionIconCache[ActionIconType.Status][key] = {}
      for (let size in actionIcon[key]) {
        actionIconCache[ActionIconType.Status][key][size] = getImageData(
          actionIcon[key][size]
        )
      }
    }
  }

  return true
}

export async function getLoadingActionIcon() {
  if (actionIconCache[ActionIconType.Loading] === undefined) {
    const res = await loadActionIcons()
    if (!res) {
      return undefined
    }
  }

  return actionIconCache[ActionIconType.Loading]
}

export async function getStatusActionIcon(
  pageEnabled: boolean,
  hostEnabled: boolean
) {
  if (actionIconCache[ActionIconType.Status] === undefined) {
    const res = await loadActionIcons()
    if (!res) {
      return undefined
    }
  }

  return actionIconCache[ActionIconType.Status]?.[
    getStatusKey(pageEnabled, hostEnabled)
  ]
}

function getImageData(data: ActionIconData) {
  const canvas = new OffscreenCanvas(data.size, data.size)
  const context = canvas.getContext("2d")
  let imageData = context.createImageData(data.size, data.size)
  imageData.data.set(Buffer.from(data.base64Data, "base64"))
  return imageData
}
