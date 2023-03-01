import { useStorage } from "@plasmohq/storage/hook"
import { useEffect, useRef, useState } from "react"
import { ConfigKeys, Theme } from "~config"
import {
  detectSystemTheme,
  SystemThemeChangeListener
} from "~utils/system-theme"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>()
  const [configTheme, setConfigTheme] = useStorage<Theme>(ConfigKeys.theme)
  const systemThemeChangeListener = useRef<SystemThemeChangeListener>(null)

  useEffect(() => {
    if (configTheme == Theme.System) {
      setTheme(detectSystemTheme())
    } else {
      setTheme(configTheme)
    }

    if (configTheme == Theme.System) {
      systemThemeChangeListener.current = new SystemThemeChangeListener(
        (theme) => {
          setTheme(theme)
        }
      )
      systemThemeChangeListener.current.addListener()
    } else {
      if (systemThemeChangeListener.current != null) {
        systemThemeChangeListener.current.removeListener()
        systemThemeChangeListener.current = null
      }
    }
  }, [configTheme])

  return [theme, configTheme, setConfigTheme] as const
}
