import { useEffect, useState } from "react"

import { Mode, Theme } from "~config"
import { useSiteConfig, useTabUrl, useTheme } from "~hooks"
import { MessageNames } from "~constants"
import {
  OptionsPanel,
  StatusSwitch,
  StatusSwitchState,
  SummarizeButton
} from "./components"
import "./popup.css"
import { useOptionsUrl } from "~hooks/options-url"

function IndexPopup() {
  const [statusSwitchState, setStatusSwitchState] =
    useState<StatusSwitchState>()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [theme] = useTheme()
  useEffect(() => {
    if (theme == Theme.Dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  const [optionsUrl] = useOptionsUrl()

  const [url] = useTabUrl()
  const {
    mode,
    enabled,
    enabledReason,
    effectiveConfig,
    effectiveConfigType,
    toggleEnabled,
    toggleForcePageEnabled,
    saveConfig,
    restoreConfig
  } = useSiteConfig(url)

  useEffect(() => {
    if (enabledReason === undefined) {
      return
    }
    setStatusSwitchState({
      secondary: enabledReason.isPage,
      checked: enabledReason.isManually
    })
  }, [enabledReason])

  async function onUpdateState(newState: StatusSwitchState) {
    toggleEnabled(newState.secondary, newState.checked)
  }

  async function onForcePageChange(checked: boolean) {
    toggleForcePageEnabled(checked)
  }

  function onSummarizePage() {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0]?.id, { name: MessageNames.SummarizePage })
    })
    window.close()
  }

  function togglePanel() {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0]?.id, { name: MessageNames.TogglePanel })
    })
    window.close()
  }

  if (theme === undefined || url == undefined) {
    return null
  }

  return (
    <div className="flex w-max flex-col justify-between bg-white pt-1 text-xs font-medium text-black dark:bg-neutral-900 dark:text-white">
      {url === "" ? (
        <span className="px-2.5 py-2">
          Recap only works under http/https url.
        </span>
      ) : (
        <>
          <div className="flex flex-col gap-2 px-2">
            {statusSwitchState ? (
              <>
                <div className="">
                  <StatusSwitch
                    action={`${mode == Mode.Active ? "Disable" : "Enable"}`}
                    state={statusSwitchState}
                    onChange={onUpdateState}
                    forcePageChecked={enabledReason?.forcePage}
                    onForcePageChange={onForcePageChange}
                  />
                </div>
                {enabled ? (
                  <>
                    <div>
                      <SummarizeButton
                        settingsOpen={settingsOpen}
                        onSettingsOpen={(open) => {
                          setSettingsOpen(open)
                        }}
                        onSummarizePage={onSummarizePage}
                      />
                      {settingsOpen ? (
                        <OptionsPanel
                          config={effectiveConfig}
                          configType={effectiveConfigType}
                          onSave={saveConfig}
                          onRestore={restoreConfig}
                        />
                      ) : null}
                    </div>

                    <div
                      className="block select-none rounded px-2.5 py-2 text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      onClick={togglePanel}>
                      Toggle panel visibility
                    </div>
                  </>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="mt-2 w-full bg-neutral-200 px-2 py-2 text-right text-xs text-neutral-400 dark:bg-neutral-800">
            <span>{`Running in `}</span>
            <a
              className="capitalize text-black underline dark:text-white"
              href={optionsUrl}
              target="_blank"
              rel="noreferrer">{`${mode} mode`}</a>
          </div>
        </>
      )}
    </div>
  )
}

export default IndexPopup
