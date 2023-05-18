import { useStorage } from "@plasmohq/storage/hook"
import { useEffect } from "react"

import logo from "url:~assets/icon.png"
import { ConfigKeys, PanelPosition, Theme } from "~config"
import { useTheme } from "~hooks"
import { getExtensionVersion } from "~utils"
import { generateActionIconsIfAbesent } from "~utils/action-icon"
import {
  ArticleContainerStep,
  ExcludeCantainerCheckBox,
  HeadingAnchorSelect,
  ModeRadioGroup,
  ProviderTab,
  SavableInput,
  ShortcutsTable
} from "./components"
import "./options.css"
import { AiFillStar } from "~icons"
import PromptInput from "./components/prompt-input"

function IndexOptions() {
  const [theme, configTheme, setTheme] = useTheme()
  const [minWords, setMinWords] = useStorage(ConfigKeys.minWords)
  const [panelPosition, setPanelPosition] = useStorage(ConfigKeys.panelPosition)
  const [containers, setContainers] = useStorage<string[]>(
    ConfigKeys.articleContainers
  )
  const [excludes, setExcludes] = useStorage<string[]>(
    ConfigKeys.excludeContainers
  )
  const [headingAnchor, setHeadingAnchor] = useStorage(ConfigKeys.headingAnchor)

  useEffect(() => {
    if (theme == Theme.Dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  useEffect(() => {
    if (document.location.hash !== "") {
      setTimeout(() => {
        document
          .querySelector(document.location.hash)
          .scrollIntoView({ behavior: "smooth", block: "start" })
      }, 300)
    }
  }, [])

  useEffect(() => {
    generateActionIconsIfAbesent()
  }, [])

  const onThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let theme = e.target.value as Theme
    setTheme(theme)
  }

  const onPanelPositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let position = e.target.value as PanelPosition
    setPanelPosition(position)
  }

  return (
    <div className="min-h-[100vh] min-w-[100vh] bg-white pb-10 text-base text-black dark:bg-neutral-900 dark:text-white">
      <nav className="flex flex-row items-center justify-between px-10 pt-5">
        <div className="flex flex-row items-center gap-2">
          <img src={logo} className="h-8 w-8 rounded-lg object-scale-down" />
          <span className="font-semibold">
            Recap (v{getExtensionVersion()})
          </span>
          <a
            href="https://recapext.xyz/chrome?utm_source=options"
            target="_blank"
            rel="noreferrer">
            <span className="flex text-amber-400">
              <AiFillStar />
              <AiFillStar />
              <AiFillStar />
              <AiFillStar />
              <AiFillStar />
            </span>
          </a>
        </div>
        <div className="flex flex-row gap-3">
          {[
            {
              title: "Feedback",
              url: "https://github.com/yaozhiwang/recap/issues"
            },
            {
              title: "Twitter",
              url: "https://twitter.com/recapext"
            },
            {
              title: "Source code",
              url: "https://github.com/yaozhiwang/recap"
            }
          ].map((val, id) => {
            return (
              <a
                className="text-blue-600 visited:text-purple-600 hover:text-blue-800 hover:underline"
                key={id}
                href={val.url}
                target="_blank"
                rel="noreferrer">
                {val.title}
              </a>
            )
          })}
        </div>
      </nav>
      <main className="mx-auto mt-14 flex w-[500] flex-col gap-5">
        <div>
          <h2 className="text-3xl font-bold leading-7">Options</h2>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-bold leading-6">Mode</h3>
          <ModeRadioGroup />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-bold leading-6">Shortcuts</h3>
          <ShortcutsTable />
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <h3 className="text-2xl font-bold leading-6">Look And Feel</h3>
          </div>

          <div className="flex flex-col gap-0.5">
            <label htmlFor="theme" className="block text-lg font-medium">
              Theme
            </label>
            <div
              id="theme"
              className="flex items-center gap-3"
              onChange={onThemeChange}>
              {Object.entries(Theme).map(([k, v]) => {
                return (
                  <div key={k} className="flex flex-row items-center">
                    <input
                      id={`radio-theme-${k}`}
                      name="radio-group-theme"
                      type="radio"
                      value={v}
                      checked={configTheme == v}
                      readOnly
                      className="h-4 w-4 border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor={`radio-theme-${k}`}
                      className="ml-1 text-sm font-medium hover:text-slate-500 dark:hover:text-slate-400">
                      {k}
                    </label>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <div>
              <label htmlFor="min-words" className="block text-lg font-medium">
                Minimum words of a passage
              </label>
              <p className="text-sm text-neutral-500">
                Enlarge this to avoid too many passage toolbar buttons appear on
                page.
              </p>
            </div>
            <div id="min-words">
              <SavableInput
                type="number"
                errorText="Your must input a non-negtive number."
                min={0}
                defaultValue={minWords}
                onChange={setMinWords}
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <label
              htmlFor="panel-position"
              className="block text-lg font-medium">
              Default Panel Position
            </label>
            <div
              id="panel-position"
              className="flex items-center gap-3"
              onChange={onPanelPositionChange}>
              {Object.entries(PanelPosition).map(([k, v]) => {
                return (
                  <div key={k} className="flex flex-row items-center">
                    <input
                      id={`radio-panel-position-${k}`}
                      name="radio-group-panel-position"
                      type="radio"
                      value={v}
                      checked={panelPosition == v}
                      readOnly
                      className="h-4 w-4 border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor={`radio-panel-position-${k}`}
                      className="ml-1 text-sm font-medium hover:text-slate-500 dark:hover:text-slate-400">
                      {k}
                    </label>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <h3 className="text-2xl font-bold leading-6">AI</h3>
          </div>

          <div className="flex flex-col gap-0.5">
            <div>
              <label htmlFor="prompt" className="block text-lg font-medium">
                Prompt
              </label>
              <p className="text-sm text-neutral-500">
                These words will be prepended to the text sent to AI provider
              </p>
            </div>
            <div id="prompt">
              <PromptInput />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <div>
              <label htmlFor="provider" className="block text-lg font-medium">
                Provider
              </label>
            </div>
            <div id="provider" className="w-full">
              <ProviderTab />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <h3 className="text-2xl font-bold leading-6">Source Text</h3>
          </div>

          <div className="flex flex-col gap-0.5">
            <div>
              <label
                htmlFor="article-container"
                className="block text-lg font-medium">
                Default Article Containers:
              </label>
              <p className="text-sm text-neutral-500">
                The article container will be tried in following order
              </p>
            </div>
            <div id="article-container">
              <ArticleContainerStep
                containers={containers}
                onUpdate={setContainers}
              />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div>
              <label
                htmlFor="exclude-container"
                className="block text-lg font-medium">
                Default Exclude Containers:
              </label>
              <p className="text-sm text-neutral-500">
                Text in following containers will be excluded
              </p>
            </div>
            <div id="exclude-container">
              <ExcludeCantainerCheckBox
                excludes={excludes}
                onUpdate={setExcludes}
              />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <label
              htmlFor="heading-anchor"
              className="block text-lg font-medium">
              Default Heading Anchor:
            </label>
            <p className="text-sm text-neutral-500">
              Specify where to show the passage toolbar buttons
            </p>
            <div id="heading-anchor">
              <HeadingAnchorSelect
                anchor={headingAnchor}
                onUpdate={setHeadingAnchor}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default IndexOptions
