import colors from "tailwindcss/colors"
import iconFile from "url:~/assets/icon.svg"
import type { EnabledDetails } from "~hooks"
import { grayscaleImage } from "~utils/action-icon/utils"

const enabledColor = colors.emerald[500]
const disabledColor = colors.orange[500]

export function getStatusIconData(
  enabledDetails: EnabledDetails,
  iconSize = 32
) {
  const { pageEnabled, hostEnabled } = enabledDetails

  return new Promise<ImageData>(async (resolve, reject) => {
    function transform(svg: SVGSVGElement) {
      const ring = svg.querySelector("#bg-ring")
      if (ring == undefined) {
        console.warn("Could not find bg-ring")
        return false
      }
      ring.setAttribute("stroke", "#fff")
      ring.setAttribute("stroke-width", "2")
      ring.setAttribute("fill", pageEnabled ? enabledColor : disabledColor)

      const fg = svg.querySelector("#g-fg")
      if (fg == undefined) {
        console.warn("Could not find g-fg")
        return false
      }
      fg.setAttribute("transform", "matrix(.8 0 0 .8 12.8 12.8)")

      const rect = svg.querySelector("#bg-rect")
      if (rect == undefined) {
        console.warn("Could not find bg-rect")
        return false
      }
      rect.setAttribute("fill", hostEnabled ? enabledColor : disabledColor)

      return true
    }

    getIconData(iconSize, transform).then((imageData) => {
      resolve(imageData)
    })
  })
}

export function getLoadingIconData(iconSize: number) {
  return new Promise<ImageData>(async (resolve, reject) => {
    getIconData(iconSize).then((imageData) => {
      grayscaleImage(imageData)
      resolve(imageData)
    })
  })
}

function getIconData(
  iconSize: number,
  transform?: (svg: SVGSVGElement) => boolean
) {
  return new Promise<ImageData>(async (resolve, reject) => {
    const resp = await fetch(iconFile)
    const doc = new window.DOMParser().parseFromString(
      await resp.text(),
      "text/xml"
    )

    const svg = doc.querySelector("svg")
    if (svg === undefined) {
      throw TypeError("input is not a SVG xml")
    }
    svg.setAttribute("width", iconSize.toString())
    svg.setAttribute("height", iconSize.toString())

    if (transform) {
      if (!transform(svg)) {
        console.warn("Failed to transform svg")
      }
    }

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
      resolve(imageData)
    }
  })
}
