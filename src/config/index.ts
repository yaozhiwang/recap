import { Storage } from "@plasmohq/storage"

export enum Mode {
  Passive = "passive",
  Active = "active"
}

export enum ArticleContainer {
  Article = "article",
  Section = "section",
  Main = "main",
  Body = "body"
}

export enum ExcludeContainer {
  Nav = "nav",
  Aside = "aside",
  Header = "header",
  Footer = "footer"
}

export enum HeadingAnchor {
  H1 = "h1",
  H2 = "h2",
  H3 = "h3",
  H4 = "h4",
  H5 = "h5",
  H6 = "h6"
}

export enum Theme {
  System = "system",
  Light = "light",
  Dark = "dark"
}

export enum PanelPosition {
  Bottom = "bottom",
  Left = "left",
  Right = "right"
}

export enum ConfigKeys {
  mode = "config.mode",
  articleContainers = "config.articleContainers",
  excludeContainers = "config.excludeContainers",
  headingAnchor = "config.headingAnchor",
  theme = "config.theme",
  minWords = "config.minWords",
  panelPosition = "config.panelPosition",
  prompt = "config.prompt"
}

const defaultConfigs = {
  [ConfigKeys.mode]: Mode.Active,
  [ConfigKeys.articleContainers]: [
    ArticleContainer.Article,
    ArticleContainer.Body
  ],
  [ConfigKeys.excludeContainers]: Object.values<string>(ExcludeContainer)
    .filter((v) => v != ExcludeContainer.Header)
    .sort(),
  [ConfigKeys.headingAnchor]: HeadingAnchor.H2,
  [ConfigKeys.theme]: Theme.System,
  [ConfigKeys.minWords]: 0,
  [ConfigKeys.panelPosition]: PanelPosition.Right,
  [ConfigKeys.prompt]: "Summarize this text:"
}

export * from "./site"
export * from "./provider"

import { saveDefaultProviderConfigs } from "./provider"
import { saveDefaultSiteConfigs } from "./site"
export async function saveDefaultConfigs() {
  const storage = new Storage()

  for (const k in defaultConfigs) {
    if ((await storage.get(k)) === undefined) {
      await storage.set(k, defaultConfigs[k])
    }
  }

  await saveDefaultProviderConfigs()
  await saveDefaultSiteConfigs()
}
