import { HeadingAnchor } from "~config"

export function isElemVisible(elem: HTMLElement) {
  return (
    !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length) &&
    window.getComputedStyle(elem).visibility !== "hidden"
  )
}

const ExtraExcludeContainer = ["plasmo-csui", ".sr-only"]

function getExcludes(excludes?: string[]) {
  return excludes
    ? excludes.concat(ExtraExcludeContainer)
    : ExtraExcludeContainer
}

export function getInnerText(
  node: Node,
  nodeMutable: boolean,
  excludes?: string[]
) {
  let text = ""
  excludes = getExcludes(excludes)

  if (node instanceof HTMLElement) {
    for (let i = 0; i < excludes.length; i++) {
      if (node.matches(excludes[i])) {
        return text
      }
    }

    let cloned = null

    if (excludes?.length > 0) {
      const selector = excludes!.join(",")
      if (node.querySelector(selector)) {
        if (nodeMutable) {
          cloned = node
        } else {
          cloned = node.cloneNode(true)
        }
        cloned.querySelectorAll(selector).forEach((v) => {
          v.remove()
        })
        // Here we'd like to use innerText instead of textContent, because it makes more sense to use the text visible to user,
        // and textContent may contain a bunch of garbage scripts or styles.
        // But if we directly call cloned.innerText here, we will get the result same as textContent, since the cloned node is not rendered.
        // (see https://stackoverflow.com/a/73937537 and https://html.spec.whatwg.org/multipage/dom.html#the-innertext-idl-attribute)
        //
        // So the trick is we append the cloned node on document.body to make it rendered,
        // and obviously we don't want it to be visible. But we can't simply set 'display: none' or use some other normal method to hide it,
        // because that will make the cloned node not rendered again.
        // The following css is from "sr-only" of tailwindcss
        cloned.style.cssText = `
position: absolute;
width: 1px;
height: 1px;
padding: 0;
margin: -1px;
overflow: hidden;
clip: rect(0, 0, 0, 0);
white-space: nowrap;
border-width: 0;`.trim()
        document.body.appendChild(cloned)
        text = cloned.innerText
        cloned.remove()
      }
    }

    if (cloned === null) {
      text = node.innerText
    }
  } else if (node.nodeType === Node.TEXT_NODE) {
    text = node.textContent
  }

  return text.replaceAll(/[ \t]+/g, " ").trim()
}

export function getTitle(container: Element, excludes?: string[]) {
  const headings = getAllHeadingAnchors(container)

  if (headings.length <= 0) {
    return ""
  }

  for (const heading of headings) {
    if (!hasExcludeAncestor(heading, excludes!)) {
      return (heading as HTMLElement).innerText
    }
  }

  return ""
}

export function getAllHeadingAnchors(container?: Element) {
  const selector = Object.values(HeadingAnchor)
    .map((value) => `${value}`)
    .join(",")

  const root = container || document.body
  return root.querySelectorAll(selector)
}

export function hasExcludeAncestor(elem: Element, excludes: string[]) {
  excludes = getExcludes(excludes)

  let e = elem
  while (e) {
    for (let i = 0; i < excludes.length; i++) {
      if (e.matches(excludes[i])) {
        return true
      }
    }
    e = e.parentElement || null
  }

  return false
}
