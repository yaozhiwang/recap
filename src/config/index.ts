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

export type Prompt = {
  template: string
  params: { [k: string]: string }
}

const outlineFormText = ", in outline form"
export const defaultPrompt: Prompt = {
  template: "Summarize this text in {language}{outlineForm}: {content}",
  params: {
    language: "the same language used in the text",
    outlineForm: ""
  }
}
const defaultPromptRegexp = new RegExp(
  `Summarize this text in (.+)(${defaultPrompt.params.outlineForm})?: {content}`
)

export function getPromptText(prompt: Prompt) {
  if (!prompt) {
    return ""
  }
  if (!prompt.params) {
    return prompt.template ?? ""
  }

  let out = prompt.template
  for (const param of Object.keys(prompt.params)) {
    out = out.replace(`{${param}}`, prompt.params[param])
  }

  return out
}

export function getDefaultPrompt({
  prompt,
  language,
  outlineForm
}: {
  prompt: Prompt
  language?: string
  outlineForm?: boolean
}) {
  const out = { ...prompt }
  out.params = { ...prompt.params }
  if (language !== undefined && language !== null) {
    if (language) {
      out.params.language = language
    } else {
      out.params.language = defaultPrompt.params.language
    }
  }
  if (outlineForm !== undefined && outlineForm !== null) {
    if (outlineForm) {
      out.params.outlineForm = outlineFormText
    } else {
      out.params.outlineForm = ""
    }
  }

  return out
}

export function hasOutlineForm(prompt: string) {
  return prompt && prompt.includes(outlineFormText)
}

export function parseDefaultPrompt(text: string): [boolean, Prompt] {
  if (!text) {
    return [false, undefined]
  }

  const matches = text.match(defaultPromptRegexp)
  if (!matches) {
    return [false, undefined]
  }

  return [
    true,
    {
      template: defaultPrompt.template,
      params: {
        language: matches[1],
        outlineForm: matches[2] ? outlineFormText : ""
      }
    }
  ]
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
  [ConfigKeys.prompt]: defaultPrompt
}

export * from "./provider"
export * from "./site"

import {
  migrateDefaultProviderConfigs,
  saveDefaultProviderConfigs
} from "./provider"
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

export async function migrateDefaultConfigs(previousVersion: string) {
  const storage = new Storage()

  const prompt = await storage.get(ConfigKeys.prompt)
  if (typeof prompt === "string") {
    if (!prompt || prompt === "Summarize this text:") {
      await storage.set(ConfigKeys.prompt, defaultPrompt)
    } else {
      await storage.set(ConfigKeys.prompt, {
        template: prompt + "{content}",
        params: { language: "", outlineForm: "" }
      })
    }
  }

  await migrateDefaultProviderConfigs(previousVersion)
}
