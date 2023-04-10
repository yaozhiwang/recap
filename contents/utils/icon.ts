import colors from "tailwindcss/colors"
import iconFile from "url:~/assets/icon.svg"
import type { EnabledDetails } from "~hooks"

const enabledColor = colors.green[500]
const disabledColor = colors.orange[500]

export function getIconData(enabledDetails: EnabledDetails, iconSize = 32) {
  const { pageEnabled, hostEnabled } = enabledDetails

  return new Promise<string>(async (resolve, reject) => {
    const resp = await fetch(iconFile)
    const doc = new window.DOMParser().parseFromString(
      await resp.text(),
      "text/xml"
    )

    const svg = doc.querySelector("svg")
    svg?.setAttribute("width", iconSize.toString())
    svg?.setAttribute("height", iconSize.toString())

    const ring = doc.querySelector("#bg-ring")
    ring?.setAttribute("stroke", "#fff")
    ring?.setAttribute("stroke-width", "2")
    doc
      .querySelector("#g-fg")
      ?.setAttribute("transform", "matrix(.8 0 0 .8 12.8 12.8)")

    doc
      .querySelector("#bg-ring")
      ?.setAttribute("fill", pageEnabled ? enabledColor : disabledColor)
    doc
      .querySelector("#bg-rect")
      ?.setAttribute("fill", hostEnabled ? enabledColor : disabledColor)

    // https://stackoverflow.com/a/13999263
    const str = new XMLSerializer().serializeToString(doc)
    const svgBlob = new Blob([str], {
      type: "image/svg+xml;charset=utf-8"
    })

    const url = window.URL.createObjectURL(svgBlob)

    const img = new Image()
    img.src = url
    img.onload = function () {
      const canvas = new OffscreenCanvas(iconSize, iconSize)
      const context = canvas.getContext("2d")
      context.drawImage(img, 0, 0)
      window.URL.revokeObjectURL(url)

      const imageData = context.getImageData(0, 0, iconSize, iconSize)
      resolve(Buffer.from(imageData.data.buffer).toString("base64"))
    }
  })
}
