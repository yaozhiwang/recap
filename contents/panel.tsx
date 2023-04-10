import { Storage } from "@plasmohq/storage"
import baseCssText from "data-text:~/style.css"
import type { PlasmoCSConfig, PlasmoGetOverlayAnchor } from "plasmo"
import { useEffect, useMemo, useRef, useState } from "react"
import logo from "url:~assets/icon.svg"
import { ResultTextArea } from "~components/contents"
import ProviderInfo from "~components/provider-info"
import { ConfigKeys, PanelPosition, Theme, urlNormalize } from "~config"
import { MessageNames } from "~constants"
import { useTheme } from "~hooks"
import {
  VscChromeClose as CloseIcon,
  VscLayoutPanel as DockBottomIcon,
  VscLayoutPanelOff as DockBottomOffIcon,
  VscLayoutSidebarLeft as DockLeftIcon,
  VscLayoutSidebarLeftOff as DockLeftOffIcon,
  VscLayoutSidebarRight as DockRightIcon,
  VscLayoutSidebarRightOff as DockRightOffIcon,
  IoRefreshCircleOutline as RerunIcon
} from "~icons"
import { classNames } from "~utils"
import { useFullTextContent } from "./hooks/fulltext-content"
import {
  SummaryContent,
  SummaryStatus,
  isRunningStatus,
  useSummaryContent
} from "./hooks/summary-content"
import { getIconData } from "./utils/icon"

export const config: PlasmoCSConfig = {
  matches: ["http://*/*", "https://*/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = baseCssText
  return style
}

export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () =>
  document.body

const PanelOverlay = () => {
  const [theme] = useTheme()
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState<PanelPosition>()
  const pageContent = useRef("")
  const textContent = useRef("")
  const [summarySource, setSummarySource] = useState<"page" | "text">()

  const [pageSummary, startSummarizePage] = useSummaryContent()
  const [textSummary, startSummarizeText] = useSummaryContent()
  const pageSummaryRef = useRef<SummaryContent>(null)
  const textSummaryRef = useRef<SummaryContent>(null)

  const { enabledDetails, content: fullTextContent } = useFullTextContent(
    urlNormalize(location.href)
  )

  const summaryContent = useMemo(() => {
    if (summarySource === "page") {
      return pageSummary
    } else if (summarySource === "text") {
      return textSummary
    }
    return null
  }, [summarySource, pageSummary, textSummary])

  useEffect(() => {
    ;(async () => {
      const storage = new Storage()

      setPosition(await storage.get(ConfigKeys.panelPosition))
    })()
  }, [])

  useEffect(() => {
    if (enabledDetails === undefined) {
      return
    }

    const iconSize = 32
    getIconData(enabledDetails, iconSize).then((imageDataBuffer) => {
      chrome.runtime.sendMessage({
        name: MessageNames.UpdateEnabled,
        enabledDetails,
        imageDataBuffer,
        iconSize
      })
    })
  }, [enabledDetails])

  useEffect(() => {
    pageContent.current = fullTextContent
  }, [fullTextContent])

  useEffect(() => {
    const listener = function (msg) {
      if (msg?.name === MessageNames.TogglePanel) {
        setShow((show) => !show)
      } else if (msg?.name === MessageNames.SummarizeText) {
        setShow(true)
        setSummarySource("text")
        if (isRunningStatus(textSummaryRef.current?.status)) {
          // TODO: show notification to user that there is a pending summary
          return
        }
        textContent.current = msg?.text
        startSummarizeText(textContent.current)
      } else if (msg?.name === MessageNames.SummarizePage) {
        setShow(true)
        setSummarySource("page")
        if (
          pageSummaryRef.current === null ||
          pageSummaryRef.current.status === SummaryStatus.Error
        ) {
          startSummarizePage(pageContent.current)
        }
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => {
      chrome.runtime.onMessage.removeListener(listener)
    }
  }, [])

  useEffect(() => {
    if (pageSummary) {
      pageSummaryRef.current = pageSummary
    }
  }, [pageSummary])

  useEffect(() => {
    if (textSummary) {
      textSummaryRef.current = textSummary
    }
  }, [textSummary])

  function rerun() {
    if (summarySource === "text") {
      startSummarizeText(textContent.current)
    }

    if (summarySource === "page") {
      startSummarizePage(pageContent.current)
    }
  }

  return (
    <>
      {show && position !== undefined ? (
        <div className={`${theme == Theme.Dark ? "dark" : ""}`}>
          <div
            className={classNames(
              position == PanelPosition.Bottom
                ? "bottom-6 right-8 left-8 h-[240]"
                : "",
              position == PanelPosition.Left
                ? "top-16 left-8 h-[500] w-[448]"
                : "",
              position == PanelPosition.Right
                ? "top-16 right-8 h-[500] w-[448]"
                : "",
              isRunningStatus(summaryContent?.status)
                ? "cursor-wait"
                : "cursor-default",
              "fixed overflow-hidden rounded-2xl bg-white text-black shadow-lg shadow-neutral-300 dark:bg-neutral-900 dark:text-white"
            )}>
            <div
              className={classNames(
                position == PanelPosition.Bottom ? "right-8 left-8" : "",
                position == PanelPosition.Left ? "w-[448]" : "",
                position == PanelPosition.Right ? "w-[448]" : "",
                "fixed flex cursor-default flex-row justify-between rounded-t-2xl bg-neutral-200 px-2 py-4 dark:bg-neutral-800"
              )}>
              <button
                className="cursor-pointer hover:text-slate-500 dark:hover:text-slate-400"
                onClick={() => {
                  setShow(false)
                }}>
                <CloseIcon className="h-6 w-6" />
              </button>
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-row items-center gap-1">
                <img
                  src={logo}
                  className="h-6 w-6 rounded-lg object-scale-down"
                />
                <span className="font-[cursive]">Recap</span>
              </div>
              <div className="flex flex-row items-center gap-2">
                <button
                  className="cursor-pointer enabled:hover:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 enabled:dark:hover:text-slate-400"
                  disabled={
                    !summaryContent || isRunningStatus(summaryContent?.status)
                  }
                  onClick={(e) => {
                    rerun()
                  }}>
                  <RerunIcon className="h-6 w-6" />
                </button>
                <div className="flex flex-row">
                  {[
                    {
                      icon: DockLeftIcon,
                      offIcon: DockLeftOffIcon,
                      position: PanelPosition.Left
                    },
                    {
                      icon: DockBottomIcon,
                      offIcon: DockBottomOffIcon,
                      position: PanelPosition.Bottom
                    },
                    {
                      icon: DockRightIcon,
                      offIcon: DockRightOffIcon,
                      position: PanelPosition.Right
                    }
                  ].map((value, id) => {
                    return (
                      <div className="flex flex-row items-center" key={id}>
                        {position === value.position ? (
                          <button
                            className="cursor-pointer hover:text-slate-500 dark:hover:text-slate-400"
                            onClick={() => {
                              setPosition(value.position)
                            }}>
                            <value.icon className="h-6 w-6" />
                          </button>
                        ) : (
                          <button
                            className="cursor-pointer hover:text-slate-500 dark:hover:text-slate-400"
                            onClick={() => {
                              setPosition(value.position)
                            }}>
                            <value.offIcon className="h-6 w-6" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="absolute top-[56] bottom-[32] w-full">
              <ResultTextArea content={summaryContent} />
            </div>
            <div className="absolute bottom-0 w-full">
              <ProviderInfo />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default PanelOverlay
