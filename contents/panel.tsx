import { Storage } from "@plasmohq/storage"
import baseCssText from "data-text:~/style.css"
import type { PlasmoCSConfig, PlasmoGetOverlayAnchor } from "plasmo"
import { useEffect, useMemo, useRef, useState } from "react"
import logo from "url:~assets/icon.png"
import { ResultTextArea } from "~components/contents"
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
  VscLayoutSidebarRightOff as DockRightOffIcon
} from "~icons"
import { classNames } from "~utils"
import { useFullTextContent } from "./hooks/fulltext-content"
import {
  isRunningStatus,
  SummaryContent,
  SummaryStatus,
  useSummaryContent
} from "./hooks/summary-content"

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
  const [summarySource, setSummarySource] = useState<"page" | "text">()

  const [pageSummary, startSummarizePage] = useSummaryContent()
  const [textSummary, startSummarizeText] = useSummaryContent()
  const pageSummaryRef = useRef<SummaryContent>(null)
  const textSummaryRef = useRef<SummaryContent>(null)

  const [, fullTextContent] = useFullTextContent(urlNormalize(location.href))

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
        startSummarizeText(msg?.text)
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
              "fixed overflow-y-scroll rounded-2xl bg-white text-black shadow-lg shadow-neutral-300 dark:bg-neutral-900 dark:text-white"
            )}>
            <div
              className={classNames(
                position == PanelPosition.Bottom ? "right-8 left-8" : "",
                position == PanelPosition.Left ? "w-[448]" : "",
                position == PanelPosition.Right ? "w-[448]" : "",
                "fixed flex cursor-default flex-row justify-between rounded-t-2xl bg-neutral-200 py-4 px-6 dark:bg-neutral-800"
              )}>
              <button
                className="cursor-pointer hover:text-slate-500 dark:hover:text-slate-400"
                onClick={() => {
                  setShow(false)
                }}>
                <CloseIcon className="h-6 w-6" />
              </button>
              <div className="flex flex-row items-center gap-1">
                <img
                  src={logo}
                  className="h-6 w-6 rounded-lg object-scale-down"
                />
                <span className="font-[cursive]">Recap</span>
              </div>
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
                    <div key={id}>
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
            <div className="mt-[56] p-6">
              <ResultTextArea content={summaryContent} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default PanelOverlay
