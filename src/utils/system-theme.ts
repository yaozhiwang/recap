import { Theme } from "~config"

export interface SystemThemeChangeListener {
  onChange: (theme: Theme) => void
}

export class SystemThemeChangeListener implements SystemThemeChangeListener {
  darkMediaQuery: MediaQueryList
  lightMediaQuery: MediaQueryList
  darkListener: (e: MediaQueryListEvent) => void
  lightListener: (e: MediaQueryListEvent) => void

  constructor(onChange: (theme: Theme) => void) {
    this.onChange = onChange
    this.darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    this.lightMediaQuery = window.matchMedia("(prefers-color-scheme: light)")
    this.darkListener = (e) => {
      if (e.matches) {
        this.onChange(Theme.Dark)
      }
    }
    this.lightListener = (e) => {
      if (e.matches) {
        this.onChange(Theme.Light)
      }
    }
  }

  addListener() {
    this.darkMediaQuery.addEventListener("change", this.darkListener)
    this.lightMediaQuery.addEventListener("change", this.lightListener)
  }

  removeListener() {
    this.darkMediaQuery.removeEventListener("change", this.darkListener)
    this.lightMediaQuery.removeEventListener("change", this.lightListener)
  }
}

export function detectSystemTheme() {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return Theme.Dark
  }
  return Theme.Light
}
