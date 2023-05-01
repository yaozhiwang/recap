import { useStorage } from "@plasmohq/storage/hook"
import cssText from "data-text:./passage.css"
import baseCssText from "data-text:~/style.css"
import type {
  PlasmoCSConfig,
  PlasmoCSUIAnchor,
  PlasmoGetInlineAnchorList,
  PlasmoRender
} from "plasmo"
import { useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import { ResultTextArea } from "~components/contents"
import ProviderInfo from "~components/provider-info"
import { ConfigKeys, Theme, urlNormalize } from "~config"
import { useTheme } from "~hooks"
import {
  TbLayoutNavbarCollapse as CloseIcon,
  HiOutlineReceiptRefund as RecapIcon,
  IoRefreshCircleOutline as RerunIcon,
  HiOutlineClipboardList as SummarizeIcon
} from "~icons"
import { classNames } from "~utils"
import { getAllHeadingAnchors } from "~utils/dom"
import { usePassageContent } from "./hooks/passage-content"
import {
  SummaryStatus,
  isRunningStatus,
  useSummaryContent
} from "./hooks/summary-content"

export const config: PlasmoCSConfig = {
  matches: ["http://*/*", "https://*/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = baseCssText + cssText
  return style
}

let anchorList: NodeList = null
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  anchorList = getAllHeadingAnchors()

  // anchorList = Array.prototype.filter.call(
  //   anchorList,
  //   isElemVisible
  // )
  return anchorList
}

// Use this to optimize unmount lookups
export const getShadowHostId = ({ element }) => {
  let id = 0
  if (anchorList) {
    Array.prototype.every.call(anchorList, (node, idx) => {
      if (node === element) {
        id = idx
        return false
      }
      return true
    })
  }
  return `recap-passage-${id}`
}

const PassageInline = (props: { anchor: PlasmoCSUIAnchor }) => {
  const [theme] = useTheme()
  const [open, setOpen] = useState(false)

  const [minWords] = useStorage(ConfigKeys.minWords)

  const { show, text, prevText } = usePassageContent(
    urlNormalize(location.href),
    props.anchor.element
  )

  useEffect(() => {
    if (!show) {
      setOpen(false)
    }
  }, [show])

  const [summarySource, setSummarySource] = useState<"this" | "prev">()

  const [thisSummary, startSummaryThis] = useSummaryContent()
  const [prevSummary, startSummaryPrev] = useSummaryContent()

  const numWords = useMemo(() => {
    return text.split(/\s+/).filter(Boolean).length
  }, [text])

  const numPrevWords = useMemo(() => {
    return prevText.split(/\s+/).filter(Boolean).length
  }, [prevText])

  const summaryContent = useMemo(() => {
    if (summarySource === "this") {
      return thisSummary
    } else if (summarySource === "prev") {
      return prevSummary
    }
    return null
  }, [summarySource, thisSummary, prevSummary])

  function summary(source: "this" | "prev") {
    setSummarySource(source)

    if (source === "this") {
      if (thisSummary === null || thisSummary.status == SummaryStatus.Error) {
        startSummaryThis(text)
      }
    }

    if (source === "prev") {
      if (prevSummary === null || prevSummary.status == SummaryStatus.Error) {
        startSummaryPrev(prevText)
      }
    }
  }

  function rerun() {
    if (summarySource === "this") {
      startSummaryThis(text)
    }

    if (summarySource === "prev") {
      startSummaryPrev(prevText)
    }
  }

  return (
    <>
      {show && numWords > minWords ? (
        <div
          className={classNames("h-full", theme == Theme.Dark ? "dark" : "")}>
          <details
            className="group/collaps relative mb-2 mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-white text-black duration-300 open:w-full dark:border-neutral-500 dark:bg-neutral-900 dark:text-white"
            open={open}>
            <summary
              className="flex cursor-row-resize items-center justify-between gap-0 bg-neutral-200 p-1 dark:bg-neutral-800"
              onClick={(e) => {
                setOpen((open) => !open)
                e.stopPropagation()
                e.preventDefault()
              }}>
              <div>
                <div className="flex flex-row group-open/collaps:hidden">
                  <ToggleButton
                    name="summary"
                    Icon={SummarizeIcon}
                    open={open}
                    text={`Summary this passage (${numWords} words)`}
                    onClick={() => summary("this")}
                  />

                  <ToggleButton
                    name="recap"
                    Icon={RecapIcon}
                    open={open}
                    text={`Recap util this passage (${numPrevWords} words)`}
                    onClick={() => summary("prev")}
                  />
                </div>
                <CloseIcon className="hidden h-6 w-6 cursor-pointer hover:text-slate-500 group-open/collaps:inline dark:hover:text-slate-400" />
              </div>
              {open ? (
                <div className="mx-2">
                  {summarySource === "this" ? "Summary" : "Recap"}
                </div>
              ) : null}
              <button
                className="hidden cursor-pointer enabled:hover:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 group-open/collaps:inline enabled:dark:hover:text-slate-400"
                disabled={
                  !summaryContent || isRunningStatus(summaryContent?.status)
                }
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  rerun()
                }}>
                <RerunIcon className="h-6 w-6" />
              </button>
            </summary>
            <div
              className={classNames(
                isRunningStatus(summaryContent?.status) ? "cursor-wait" : "",
                "p-2 text-base"
              )}>
              <ResultTextArea content={summaryContent} />
            </div>
            <div className="w-full">
              <ProviderInfo />
            </div>
          </details>
        </div>
      ) : null}
    </>
  )
}

function ToggleButton(props: {
  name: string
  Icon: React.ElementType
  open: boolean
  text: string
  onClick?: React.MouseEventHandler
}) {
  return (
    <span className="group cursor-pointer" onClick={props.onClick}>
      <props.Icon className="inline h-6 w-6 group-hover:text-slate-500 dark:group-hover:text-slate-400" />
      <span
        className={`hidden text-slate-500 dark:group-hover:text-slate-400 ${(() =>
          `group-hover:inline`)()}`}>
        {props.text}
      </span>
    </span>
  )
}

export const render: PlasmoRender = async (
  {
    anchor, // the observed anchor, OR document.body.
    createRootContainer // This creates the default root container
  },
  InlineCSUIContainer
) => {
  const rootContainer = await createRootContainer(anchor)

  const root = createRoot(rootContainer) // Any root
  root.render(
    // @ts-ignore
    <InlineCSUIContainer>
      <PassageInline anchor={anchor} />
    </InlineCSUIContainer>
  )
}

export default PassageInline
