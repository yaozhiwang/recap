export function isElemVisible(elem: HTMLElement) {
  return (
    !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length) &&
    window.getComputedStyle(elem).visibility !== "hidden"
  )
}

const ExtraExcludeContainer = ["plasmo-csui"]

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
    if (excludes?.indexOf(node.tagName.toLowerCase()) > -1) {
      return text
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
        // The following styles to hide out cloned node is found from google's home page, they hide the 'Accessibility' related content in this way.
        cloned.style.cssText = `
clip: rect(1px,1px,1px,1px);
height: 1px;
overflow: hidden;
position: absolute;
white-space: nowrap;
width: 1px;
z-index: -1000;
user-select: none;
-webkit-user-select: none;
padding: 0px;
margin: 0px;`.trim()
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
