import { useStorage } from "@plasmohq/storage/hook"
import { isEqual } from "lodash-es"
import { useEffect, useMemo } from "react"
import { default as DropDownMenu } from "~components/dropdown-menu"
import type { SourceTextConfig } from "~config"
import { PreviewConfigKey } from "~constants"
import type { ConfigType } from "~hooks/site-config"
import { HiChevronDown } from "~icons"
import {
  ArticleContainerStep,
  ExcludeCantainerCheckBox,
  HeadingAnchorSelect
} from "~options/components/"
import { classNames } from "~utils"

export default function OptionsPanel(props: {
  config: SourceTextConfig
  configType: ConfigType
  onSave: (dest: "page" | "host", newConfig: SourceTextConfig) => void
  onRestore: (configType: ConfigType) => void
}) {
  const { config, configType, onSave, onRestore } = props

  const [srcTxtConfig, setSrcTxtConfig, { remove: reomveSrcTxtConfig }] =
    useStorage<SourceTextConfig>(PreviewConfigKey)

  const changed = useMemo(() => {
    return !isEqual(config, srcTxtConfig)
  }, [srcTxtConfig])

  useEffect(() => {
    setSrcTxtConfig(config)
    return () => {
      reomveSrcTxtConfig()
    }
  }, [config])

  function hostTypeName(type: ConfigType["type"] | ConfigType["parentType"]) {
    if (type === "Host") {
      return "Domain"
    }
    return type
  }

  return (
    <>
      {srcTxtConfig !== undefined ? (
        <div className="mt-2 flex flex-col gap-2 border border-neutral-200 p-2 dark:border-neutral-500">
          <p className="text-sm font-semibold">
            Config from{" "}
            <span className="font-bold">{hostTypeName(configType.type)}</span>
          </p>
          <div className="flex flex-col gap-0.5">
            <div>
              <label
                htmlFor="article-container"
                className="block text-sm font-medium">
                Article Containers:
              </label>
              <p className="text-xs text-neutral-500">
                The article container will be tried in following order
              </p>
            </div>
            <div id="article-container">
              <ArticleContainerStep
                containers={srcTxtConfig.articleContainers}
                onUpdate={(newContainers) => {
                  const newConfig = { ...srcTxtConfig }
                  newConfig.articleContainers = newContainers
                  setSrcTxtConfig(newConfig)
                }}
                size="small"
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <div>
              <label
                htmlFor="exclude-container"
                className="block text-sm font-medium">
                Exclude Containers:
              </label>
              <p className="text-xs text-neutral-500">
                Text in following containers will be excluded
              </p>
            </div>
            <div id="exclude-container">
              <ExcludeCantainerCheckBox
                excludes={srcTxtConfig.excludeContainers}
                onUpdate={(newExcludes) => {
                  const newConfig = { ...srcTxtConfig }
                  newConfig.excludeContainers = newExcludes
                  setSrcTxtConfig(newConfig)
                }}
                size="small"
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <label
              htmlFor="heading-anchor"
              className="block text-sm font-medium">
              Heading Anchor:
            </label>
            <p className="text-xs text-neutral-500">
              Specify where to show the passage toolbar buttons
            </p>
            <div id="heading-anchor">
              <HeadingAnchorSelect
                anchor={srcTxtConfig.headingAnchor}
                onUpdate={(newAnchor) => {
                  const newConfig = { ...srcTxtConfig }
                  newConfig.headingAnchor = newAnchor
                  setSrcTxtConfig(newConfig)
                }}
                size="small"
              />
            </div>
          </div>

          <div className="flex flex-row justify-between">
            <div>
              {configType.parentType !== "None" ? (
                <>
                  <button
                    type="button"
                    className="rounded-md bg-indigo-600 py-2 px-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    onClick={() => {
                      onRestore(configType)
                    }}>
                    Restore
                  </button>
                  <p className="mt-1 text-xs text-neutral-500">
                    Restore from{" "}
                    <span className="font-semibold">
                      {hostTypeName(configType.parentType)}
                    </span>{" "}
                    config
                  </p>
                </>
              ) : null}
            </div>

            <div
              className={classNames(
                changed
                  ? "cursor-pointer text-white hover:bg-indigo-700"
                  : "cursor-not-allowed opacity-50",
                "flex h-fit select-none flex-row divide-x divide-neutral-400 rounded-md bg-indigo-600 text-sm font-medium text-white shadow-sm dark:divide-neutral-500"
              )}>
              <button
                className="px-2.5 py-2"
                onClick={() => {
                  onSave("page", srcTxtConfig)
                }}
                disabled={!changed}>
                Save
              </button>
              <div>
                <DropDownMenu
                  button={
                    <div
                      className={classNames(
                        changed ? "hover:text-white dark:hover:text-white" : "",
                        "px-1.5 py-2 text-neutral-400"
                      )}>
                      <HiChevronDown className="h-5 w-5 " aria-hidden="true" />
                    </div>
                  }
                  items={[`Save for whole domain`]}
                  disabled={!changed}
                  align="right"
                  size="small"
                  onSelect={() => {
                    onSave("host", srcTxtConfig)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
