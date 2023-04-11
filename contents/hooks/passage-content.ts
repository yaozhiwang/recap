import { range } from "lodash-es"
import { useEffect, useMemo, useState } from "react"
import { useSiteConfigWithPreview } from "~hooks"
import { getInnerText } from "~utils/dom"
import { useFullTextContainer } from "./fulltext-container"

export function usePassageContent(url: string, anchor: Element) {
  const [show, setShow] = useState<boolean>(false)
  const [text, setText] = useState("")
  const [prevText, setPrevText] = useState("")

  const { enabled, config } = useSiteConfigWithPreview(url)
  const [fullTextContainer] = useFullTextContainer(config)

  const headingLevel = getHeadingLevel(anchor.tagName.toLowerCase())
  const configHeadingLevel = useMemo(() => {
    if (config === undefined) {
      return undefined
    }
    return getHeadingLevel(config.headingAnchor)
  }, [config])

  useEffect(() => {
    let shouldShow = false
    if (enabled && config) {
      if (headingLevel === 0 || configHeadingLevel === 0) {
        shouldShow = headingLevel === configHeadingLevel
      } else {
        shouldShow = headingLevel <= configHeadingLevel
      }

      const excludes = config.excludeContainers

      if (shouldShow && excludes.length > 0) {
        let e = anchor
        while (e) {
          const tag = e.tagName.toLowerCase()
          if (excludes.indexOf(tag) > -1) {
            shouldShow = false
            break
          }
          e = e.parentElement || null
        }
      }
    }
    setShow(shouldShow)
  }, [enabled, config])

  useEffect(() => {
    ;(async () => {
      if (fullTextContainer && config) {
        setText(
          await getPassageText(
            anchor,
            fullTextContainer,
            config.excludeContainers
          )
        )
        setPrevText(
          await getPreviousText(
            anchor,
            fullTextContainer,
            config.excludeContainers
          )
        )
      }
    })()
  }, [fullTextContainer, config])

  return {
    show,
    text,
    prevText
  } as const
}

function getHeadingLevel(tag: string) {
  if (tag.startsWith("h")) {
    return Number(tag.slice(1))
  }
  return 0
}

async function getPassageText(
  node: Element,
  fullTextContainer: string,
  excludes?: string[]
) {
  let selector = getHigherLevelSelector(fullTextContainer, node.tagName)

  let n: Node = node
  const newElem = document.createElement("div")

  do {
    newElem.appendChild(n.cloneNode(true))
    n = n.nextSibling || null
  } while (n && !(n instanceof Element && n.matches(selector)))

  const text = getInnerText(newElem, true, excludes)
  newElem.remove()

  return text
}

async function getPreviousText(
  node: Element,
  fullTextContainer: string,
  excludes?: string[]
) {
  const container = document.querySelector(fullTextContainer)

  let nextNode: Node | null = null
  const nodes: Node[] = []

  nextNode = node
  while (nextNode && nextNode !== container) {
    nodes.push(nextNode)
    nextNode = nextNode.parentNode || null
  }

  if (nodes.length < 1 || nodes[nodes.length - 1] === container) {
    console.error("Could not find container up DOM tree")
    return ""
  }

  const newElem = document.createElement("div")
  for (let i = nodes.length - 2; i >= 0; i--) {
    const parent = nodes[i + 1]
    const child = nodes[i]

    for (const ch of parent.childNodes) {
      if (ch === child) {
        break
      }
      newElem.appendChild(ch.cloneNode(true))
    }
  }

  const text = getInnerText(newElem, true, excludes)
  newElem.remove()

  return text
}

function getHigherLevelSelector(container: string, tag: string) {
  let selector = `${container} ${tag}`
  if (tag.toLowerCase().startsWith("h")) {
    selector = range(1, Number(tag.at(1)) + 1)
      .map((i) => `${container} h${i}`)
      .join(",")
  }
  return selector
}
