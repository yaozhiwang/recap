import { useEffect, useState } from "react"

export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState([])

  useEffect(() => {
    chrome.commands.getAll((commands) => {
      setShortcuts(commands)
    })
  }, [])

  return [shortcuts] as const
}
