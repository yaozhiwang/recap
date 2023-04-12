import { Storage } from "@plasmohq/storage"
import { getLoadingIconData, getStatusIconData } from "./icon-data"

const storageKey = "actionIcons"

export enum ActionIconType {
  Loading = "loading",
  Status = "status"
}

export type ActionIconData = {
  size: number
  base64Data: string
}

export const ActionIconSizes = [16, 32]

export function getStatusKey(pageEnabled: boolean, hostEnabled: boolean) {
  return `${pageEnabled}-${hostEnabled}`
}

export async function generateActionIconsIfAbesent() {
  const storage = new Storage({ area: "local" })
  let actionIcons = await storage.get<{}>(storageKey)
  if (actionIcons !== undefined) {
    return
  }

  actionIcons = { [ActionIconType.Loading]: {}, [ActionIconType.Status]: {} }

  for (let iconSize of ActionIconSizes) {
    const imageData = await getLoadingIconData(iconSize)
    actionIcons[ActionIconType.Loading][iconSize] = {
      size: iconSize,
      base64Data: Buffer.from(imageData.data.buffer).toString("base64")
    }
  }

  for (let pageEnabled of [true, false]) {
    for (let hostEnabled of [true, false]) {
      const icons = {}
      for (let iconSize of ActionIconSizes) {
        const imageData = await getStatusIconData(
          { pageEnabled, hostEnabled },
          iconSize
        )
        icons[iconSize] = {
          size: iconSize,
          base64Data: Buffer.from(imageData.data.buffer).toString("base64")
        }
      }
      actionIcons[ActionIconType.Status][
        getStatusKey(pageEnabled, hostEnabled)
      ] = icons
    }
  }

  actionIcons = await storage.set(storageKey, actionIcons)
}
