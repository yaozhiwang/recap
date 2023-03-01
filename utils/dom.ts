// import * as DOMPurify from "dompurify"
// import html2md from "html-to-md"

import { getExcludes } from "~config"

export function isElemVisible(elem: HTMLElement) {
  return (
    !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length) &&
    window.getComputedStyle(elem).visibility !== "hidden"
  )
}

// function innerText(html: string) {
//   let content = DOMPurify.sanitize(html)
//   const regex = [
//     { pattern: new RegExp("<a\b[^>]*>(.*?)</a>", "gi"), replacement: "" },
//     {
//       pattern: new RegExp("<br/?>[ \r\ns]*<br/?>", "gi"),
//       replacement: "</p><p>"
//     }
//   ]
//   for (const reg of regex) {
//     content = content.replace(reg.pattern, reg.replacement)
//   }

//   return html2md(content)
// }

export function getInnerText(elem: Element, excludes?: string[]) {
  if (elem instanceof HTMLElement) {
    excludes = getExcludes(excludes)

    if (excludes.indexOf(elem.tagName.toLowerCase()) > -1) {
      return ""
    }

    let cloned = null
    if (excludes.length > 0) {
      const selector = excludes.join(",")
      if (elem.querySelector(selector)) {
        cloned = elem.cloneNode(true)
        cloned.querySelectorAll(selector).forEach((v) => {
          v.remove()
        })
      }
    }

    if (cloned === null) {
      cloned = elem
    }

    return cloned.innerText ? cloned.innerText + "\n" : ""
    //return innerText(cloned.innerHTML) + "\n"
  }

  return ""
}
