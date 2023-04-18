import { range } from "lodash-es"
import { useEffect, useMemo, useState } from "react"
import { useSiteConfigWithPreview } from "~hooks"
import { getInnerText, hasExcludeAncestor } from "~utils/dom"
import { useArticleContainers } from "./article-container"

export function usePassageContent(url: string, anchor: Element) {
  const [show, setShow] = useState<boolean>(false)
  const [text, setText] = useState("")
  const [prevText, setPrevText] = useState("")

  const { enabled, config } = useSiteConfigWithPreview(url)
  const [articleContainers] = useArticleContainers(config)

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
        if (hasExcludeAncestor(anchor, excludes)) {
          shouldShow = false
        }
      }
    }
    setShow(shouldShow)
  }, [enabled, config])

  useEffect(() => {
    ;(async () => {
      if (articleContainers && config) {
        const [container, path] = findContainer(
          anchor,
          articleContainers[0].tagName
        )
        setText(
          await getPassageText(
            anchor,
            container,
            path,
            config.excludeContainers
          )
        )
        setPrevText(
          await getPreviousText(
            anchor,
            container,
            path,
            config.excludeContainers
          )
        )
      }
    })()
  }, [articleContainers, config])

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
  container: Element,
  path: Node[],
  excludes?: string[]
) {
  let selector = getHigherLevelSelector(node.tagName)
  const anchors = container.querySelectorAll(selector)
  let endNode: Node = null
  for (let i = 0; i < anchors.length; i++) {
    if (anchors[i] === node) {
      if (i < anchors.length - 1) {
        endNode = anchors[i + 1]
      }
      break
    }
  }
  let endPath: Node[] = null
  if (endNode !== null) {
    endPath = findPath(endNode, container)
  }

  const root = extractSubtree(container, path, endPath)
  const text = getInnerText(root, true, excludes)

  return text
}

async function getPreviousText(
  node: Element,
  container: Element,
  path: Node[],
  excludes?: string[]
) {
  const root = extractSubtree(container, null, path)
  const text = getInnerText(root, true, excludes)

  return text
}

function getHigherLevelSelector(tag: string) {
  let selector = `${tag}`
  if (tag.toLowerCase().startsWith("h")) {
    selector = range(1, Number(tag.at(1)) + 1)
      .map((i) => `h${i}`)
      .join(",")
  }
  return selector
}

function findContainer(anchor: Element, containerTag: string) {
  let n: Node | null = anchor
  const path = []
  while (n) {
    path.push(n)
    if (n === document.body) {
      break
    }
    if (n instanceof Element && n.matches(containerTag)) {
      break
    }
    n = n.parentNode || null
  }

  return [n as Element, path] as const
}

function findPath(node: Node, root: Node) {
  const path: Node[] = []
  let n: Node | null = null
  n = node
  while (n) {
    path.push(n)
    if (n === root) {
      break
    }
    n = n.parentNode || null
  }
  return path
}

function extractSubtree(root: Node, startPath: Node[], endPath: Node[]) {
  // extract subtree from root bounded by startPath(inclusive) and endPath(exclusive)
  //
  //                  *     *
  //                 /     /
  //               #(S) - # - #  startPath
  //  *   *   *   /  \     \
  //  |   |    \ /    #     #
  //  + - + - +(C) - #
  //  |   |    / \    #     #
  //  *   *   *   \  /     /
  //               +(E) - + - *  endPath
  //                 \     \
  //                  *     *
  //
  // as shown in above graph, we would like to include all nodes markded as '#',
  // and exclude all nodes marked as '*'. The '+' nodes are psudo nodes to connect all together
  //
  if (root === null || (startPath === null && endPath == null)) {
    throw TypeError("Invalid null params")
  }
  if (endPath === null) {
    // root is node S in the graph
    return extractSubtreeBelow(root, startPath)
  } else if (startPath === null) {
    // root is node E in the graph
    return extractSubtreeAbove(root, endPath)
  }

  if (startPath.length === 0 || startPath[startPath.length - 1] !== root) {
    throw TypeError("startPath does not end with root")
  }
  if (endPath.length === 0 || endPath[endPath.length - 1] !== root) {
    throw TypeError("endPath does not end with root")
  }

  const subtree = root.cloneNode(false)

  let common: Node = subtree
  let oriCommon: Node = root
  let s = startPath.length - 2
  let e = endPath.length - 2
  while (s >= 0 && e >= 0) {
    if (startPath[s] !== endPath[e]) {
      break
    }
    oriCommon = startPath[s]
    common = oriCommon.cloneNode(false)
    subtree.appendChild(common)
    s--
    e--
  }
  if (s < 0 || e < 0) {
    // startPath or endPath ended before common ancestor(node C in graph)
    return subtree
  }

  // for the common ancestor node C, we append three parts one by one(top, middle, bottom)
  // extract subtree from node S in the graph
  const top = extractSubtreeBelow(startPath[s], startPath.slice(0, s + 1))
  common.appendChild(top)

  // extract middle children
  let skip = true
  for (const ch of oriCommon.childNodes) {
    if (skip) {
      if (ch === startPath[s]) {
        skip = false
      }
      continue
    }
    if (ch === endPath[e]) {
      break
    }
    common.appendChild(ch.cloneNode(true))
  }

  // extract subtree from node E in the graph
  const bottom = extractSubtreeAbove(endPath[e], endPath.slice(0, e + 1))
  common.appendChild(bottom)

  return subtree
}

function extractSubtreeBelow(root: Node, boundary: Node[]) {
  // extract all nodes below boundary (inclusive)

  if (root === null || boundary == null) {
    throw TypeError("Invalid null params")
  }
  if (boundary.length === 0 || boundary[boundary.length - 1] !== root) {
    throw TypeError("boundary not end with root")
  }

  if (boundary.length === 1) {
    return root.cloneNode(true)
  }

  let newNode = root.cloneNode(false)
  const subtree = newNode

  let parent = root
  let skip = true
  for (const ch of parent.childNodes) {
    if (skip) {
      if (ch === boundary[boundary.length - 2]) {
        skip = false
        newNode.appendChild(
          extractSubtreeBelow(
            boundary[boundary.length - 2],
            boundary.slice(0, boundary.length - 1)
          )
        )
      }
      continue
    }

    newNode.appendChild(ch.cloneNode(true))
  }

  return subtree
}

function extractSubtreeAbove(root: Node, boundary: Node[]) {
  // extract all nodes above boundary (exclusive)

  if (root === null || boundary == null) {
    throw TypeError("Invalid null params")
  }
  if (boundary.length === 0 && boundary[boundary.length - 1] !== root) {
    throw TypeError("boundary not end with root")
  }
  let newParent = root.cloneNode(false)
  const subtree = newParent

  for (let i = boundary.length - 2; i >= 0; i--) {
    let parent = boundary[i + 1]
    for (const ch of parent.childNodes) {
      if (ch === boundary[i]) {
        const newNode = ch.cloneNode(false)
        newParent.appendChild(newNode)
        newParent = newNode
        break
      }
      newParent.appendChild(ch.cloneNode(true))
    }
  }

  return subtree
}
