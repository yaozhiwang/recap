export function grayscaleImage(data: ImageData) {
  for (let row = 0; row < data.width; row++) {
    for (let col = 0; col < data.height; col++) {
      const idx = (row * data.width + col) * 4

      const gray =
        0.2126 * data.data[idx] +
        0.7152 * data.data[idx + 1] +
        0.0722 * data.data[idx + 2]
      data.data[idx] = gray
      data.data[idx + 1] = gray
      data.data[idx + 2] = gray
    }
  }
}
