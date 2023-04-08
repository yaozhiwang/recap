import { Storage } from "@plasmohq/storage"
import { useCallback, useEffect, useState } from "react"
import { ShortcutNames, isFirstCacheKey } from "~constants"

const ShortcutsDisplayName = {
  [ShortcutNames.ToggleEnable]: "Toggle enable/disable",
  [ShortcutNames.SummarizePage]: "Summarize current page"
}

export default function ShortcutsTable() {
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [shortcuts, setShortcuts] = useState([])

  useEffect(() => {
    ;(async () => {
      const storage = new Storage()
      if (await storage.get(isFirstCacheKey)) {
        setIsFirstTime(true)
        storage.remove(isFirstCacheKey)
      }
    })()
    chrome.commands.getAll((commands) => {
      setShortcuts(commands)
    })
  }, [])

  const openShortcutPage = useCallback(() => {
    chrome.tabs.update({ url: "chrome://extensions/shortcuts" })
  }, [])

  return (
    <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-500">
      <tbody className="divide-y divide-neutral-200">
        {shortcuts
          .filter((e) => e.name !== "_execute_action")
          .map(({ name, shortcut }) => (
            <tr key={name}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium">
                {ShortcutsDisplayName[name]}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                {shortcut == "" ? (
                  isFirstTime ? (
                    <span className="text-red-500">
                      Default hotkey conflicts
                    </span>
                  ) : (
                    "Not Set"
                  )
                ) : (
                  <kbd className="rounded-lg border border-neutral-200 bg-neutral-100 px-2 py-1.5 text-sm font-semibold tracking-widest text-neutral-800 dark:border-neutral-500 dark:bg-neutral-600 dark:text-neutral-100">
                    {shortcut}
                  </kbd>
                )}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                <button
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-500 dark:hover:text-indigo-600"
                  onClick={openShortcutPage}>
                  Change
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}
