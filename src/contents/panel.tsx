import { Storage } from "@plasmohq/storage"
import baseCssText from "data-text:~/style.css"
import { cloneDeep } from "lodash-es"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useMemo, useRef, useState } from "react"
import { ResultTextArea } from "~components/contents"
import ProviderInfo from "~components/provider-info"
import { ConfigKeys, PanelPosition, Theme, urlNormalize } from "~config"
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
import { MessageNames } from "~messaging"
import { classNames } from "~utils"
import { usePageContent, type ArticleContent } from "./hooks/page-content"
import {
  SummaryContent,
  SummaryStatus,
  isDoneStatus,
  isRunningStatus,
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

// export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () =>
//   document.body

const enum SummarizePageStatus {
  Running = "running",
  Finished = "finished"
}

interface SummaryListItem {
  header: string
  summary: SummaryContent
}
interface SummaryList {
  header: string
  items: SummaryListItem[]
}

function newSingleItemSummaryList(
  summary: SummaryContent,
  header?: string
): SummaryList {
  return { header: null, items: [{ header, summary }] }
}

const PanelOverlay = () => {
  const [theme] = useTheme()
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState<PanelPosition>()
  const textContent = useRef("")
  const [summarySource, setSummarySource] = useState<"page" | "text">()
  const [summaryList, setSummaryList] = useState<SummaryList>(null)

  const [textSummary, startSummarizeText] = useSummaryContent()
  const textSummaryRef = useRef<SummaryContent>(null)

  const [articleSummary, startSummarizeArticle] = useSummaryContent()

  const [summarizePageStatus, setSummarizePageStatus] = useState(
    SummarizePageStatus.Finished
  )
  const summarizePageStatusRef = useRef(SummarizePageStatus.Finished)
  const summarizeArticleIdx = useRef(0)

  const {
    enabled,
    enabledDetails,
    content: pageContent
  } = usePageContent(urlNormalize(location.href))
  const enabledRef = useRef(false)
  const pageContentRef = useRef(null)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    pageContentRef.current = pageContent
  }, [pageContent])

  useEffect(() => {
    if (textSummary) {
      textSummaryRef.current = textSummary
    }
  }, [textSummary])

  useEffect(() => {
    if (summarizePageStatus) {
      summarizePageStatusRef.current = summarizePageStatus
    }
  }, [summarizePageStatus])

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

    chrome.runtime.sendMessage({
      name: MessageNames.UpdateActionIcon,
      enabledDetails
    })
  }, [enabledDetails])

  useEffect(() => {
    const listener = function (msg) {
      if (msg?.name === MessageNames.TogglePanel) {
        setShow((show) => !show)
      } else if (msg?.name === MessageNames.SummarizeText) {
        setShow(true)
        setSummarySource("text")
        if (isRunningStatus(textSummaryRef.current?.status)) {
          // TODO: show notification to user that there is a running task
          return
        }
        textContent.current = msg?.text
        summarizeText()
      } else if (msg?.name === MessageNames.SummarizePage) {
        setShow(true)
        setSummarySource("page")
        if (!enabledRef.current) {
          setSummaryList(
            newSingleItemSummaryList({
              status: SummaryStatus.Error,
              data: { message: "Recap is disabled on this page" }
            })
          )
          return
        }

        summarizePage()
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => {
      chrome.runtime.onMessage.removeListener(listener)
    }
  }, [])

  useEffect(() => {
    if (summarySource === "page") {
      if (!articleSummary) {
        return
      }

      const newSummaryContent = cloneDeep(summaryList)

      if (!newSummaryContent.header) {
        newSummaryContent.header = getPageHeader(
          pageContent.title,
          pageContent.articles.length
        )
      }

      if (newSummaryContent.items.length > summarizeArticleIdx.current) {
        newSummaryContent.items.pop()
      }

      if (isDoneStatus(articleSummary.status)) {
        newSummaryContent.items.push({
          header: getArticleHeader(
            pageContent.articles,
            summarizeArticleIdx.current
          ),
          summary: articleSummary
        })
        summarizeArticleIdx.current += 1

        if (summarizeArticleIdx.current < pageContent.articles.length) {
          startSummarizeArticle(
            pageContent.articles[summarizeArticleIdx.current].content
          )
        } else {
          setSummarizePageStatus(SummarizePageStatus.Finished)
        }
      } else {
        newSummaryContent.items.push({
          header: getArticleHeader(
            pageContent.articles,
            summarizeArticleIdx.current
          ),
          summary: articleSummary
        })
      }

      setSummaryList(newSummaryContent)
    } else if (summarySource == "text") {
      setSummaryList(
        newSingleItemSummaryList(
          textSummary,
          getTextHeader(textContent.current)
        )
      )
    }
  }, [summarySource, articleSummary, textSummary])

  const isRunning = useMemo(() => {
    if (summarySource === "text") {
      return isRunningStatus(textSummary?.status)
    } else if (summarySource === "page") {
      return summarizePageStatus !== SummarizePageStatus.Finished
    }
    return false
  }, [summarySource, textSummary, summarizePageStatus])

  function rerun() {
    if (summarySource === "text") {
      summarizeText()
    }

    if (summarySource === "page") {
      summarizePage()
    }
  }

  function summarizePage() {
    if (!pageContentRef.current) {
      setSummaryList(
        newSingleItemSummaryList({
          status: SummaryStatus.Error,
          data: {
            message:
              "Still working on parsing content, please try rerunning later"
          }
        })
      )
      return
    }

    if (pageContentRef.current.articles.length === 0) {
      setSummaryList(
        newSingleItemSummaryList({
          status: SummaryStatus.Error,
          data: {
            message: "No article found in this page.",
            showBugReport: true
          }
        })
      )
      return
    }

    if (summarizePageStatusRef.current === SummarizePageStatus.Running) {
      // TODO: show notification to user that there is a running task
      return
    }
    setSummarizePageStatus(SummarizePageStatus.Running)
    setSummaryList({ header: null, items: [] })
    summarizeArticleIdx.current = 0
    startSummarizeArticle(pageContentRef.current.articles[0].content)
  }

  function getPageHeader(title: string, numArticles: number) {
    let text = ""
    if (numArticles > 1) {
      if (title) {
        text += "Page Title: " + title + "\n"
      }
      text += `There are ${numArticles} articles in this page.`
    }
    return text
  }

  function getArticleHeader(articles: ArticleContent[], idx: number) {
    let text = ""
    if (articles.length > 1) {
      text += `Article #${idx + 1}\n`
    }
    if (articles[idx].title) {
      text += `Title: ${articles[idx].title}\n`
    }
    return text
  }

  function summarizeText() {
    setSummaryList({
      header: getTextHeader(textContent.current),
      items: []
    })
    startSummarizeText(textContent.current)
  }

  function getTextHeader(content: string) {
    return `Content: ${content}`
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
              isRunning ? "cursor-wait" : "cursor-default",
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
                <span className="first-letter:uppercase">{`${summarySource} Summary`}</span>
              </div>
              <div className="flex flex-row items-center gap-2">
                <button
                  className="cursor-pointer enabled:hover:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 enabled:dark:hover:text-slate-400"
                  disabled={!enabled || !summaryList || isRunning}
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
            <div className="absolute top-[56] bottom-[32] w-full overflow-scroll p-1">
              {summaryList.header && (
                <div className="whitespace-pre-wrap rounded-lg bg-neutral-200 px-2 py-2 text-lg dark:bg-neutral-800">
                  {summaryList.header}
                </div>
              )}
              {summaryList.items.map((item, id) => (
                <div
                  key={id}
                  className="mt-1 overflow-hidden rounded-t-xl rounded-b-md border border-neutral-200 dark:border-neutral-800">
                  <div className="whitespace-pre-wrap bg-neutral-200 px-2 py-2 text-lg dark:bg-neutral-800">
                    <div
                      className={classNames(
                        summarySource === "text" ? "line-clamp-3" : ""
                      )}>
                      {item.header}
                    </div>
                  </div>
                  <div className="p-2 text-base">
                    <ResultTextArea content={item.summary} />
                  </div>
                </div>
              ))}
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
