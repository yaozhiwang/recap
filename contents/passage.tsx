import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import cssText from "data-text:./passage.css"
import baseCssText from "data-text:~/style.css"
import type {
  PlasmoCSConfig,
  PlasmoCSUIAnchor,
  PlasmoGetInlineAnchorList,
  PlasmoRender
} from "plasmo"
import { useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import { ResultTextArea } from "~components/contents"
import { ConfigKeys, HeadingAnchor, Theme, urlNormalize } from "~config"
import { useTheme } from "~hooks"
import {
  HiOutlineClipboardList as SummarizeIcon,
  HiOutlineReceiptRefund as RecapIcon,
  IoRefreshCircleOutline as RerunIcon,
  TbLayoutNavbarCollapse as CloseIcon
} from "~icons"
import { classNames } from "~utils"
import { usePassageContent } from "./hooks/passage-content"
import {
  isRunningStatus,
  SummaryStatus,
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
  anchorList = await getAllHeadingAnchors()

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
        <div className={`${theme == Theme.Dark ? "dark" : ""}`}>
          <details
            className="group/collaps mb-2 mt-2 rounded-lg border border-slate-300 bg-white p-1 text-black duration-300 open:w-full dark:bg-neutral-900 dark:text-white"
            open={open}
            onToggle={() => {
              setOpen(!open)
            }}>
            <summary className="flex cursor-row-resize items-center justify-between gap-0">
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
                "px-5 py-3 text-sm"
              )}>
              <ResultTextArea content={summaryContent} />
            </div>
          </details>
        </div>
      ) : null}
    </>
  )
}

export async function getAllHeadingAnchors() {
  const storage = new Storage()
  const containers = await storage.get<string[]>(ConfigKeys.fullTextContainers)

  let selector = containers
    .map((container) =>
      Object.values(HeadingAnchor).map((value) => `${container} ${value}`)
    )
    .flat()
    .join(",")

  return document.querySelectorAll(selector)
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
