import { useMemo } from "react"
import { ShortcutNames } from "~constants"
import { useShortcuts } from "~hooks"
import { CgMoreO, CgMoreVerticalO } from "~icons"

export default function SummarizeButton(props: {
  settingsOpen: boolean
  onSettingsOpen: (open: boolean) => void
  onSummarizePage: () => void
}) {
  const [shortcuts] = useShortcuts()
  const summarizePageShortcut = useMemo(() => {
    const command = shortcuts.filter(
      (e) => e.name === ShortcutNames.SummarizePage
    )[0]
    if (!!command && command.shortcut != "") {
      return ` (${command.shortcut})`
    }
    return ""
  }, [shortcuts])

  return (
    <div className="flex w-full flex-col">
      <div className="relative pr-8">
        <button
          className="mr-2 flex w-full justify-start rounded-md border border-transparent px-2.5 py-1.5 text-sm text-black hover:bg-neutral-200 dark:text-white dark:hover:bg-neutral-700"
          onClick={() => {
            props.onSummarizePage()
          }}>
          {`Summarize this page${summarizePageShortcut}`}
        </button>
        <div
          className="absolute top-0 right-0 flex aspect-square h-full cursor-pointer select-none items-center justify-center rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700"
          onClick={() => {
            props.onSettingsOpen(!props.settingsOpen)
          }}>
          {props.settingsOpen ? (
            <CgMoreVerticalO className="h-5 w-5" />
          ) : (
            <CgMoreO className="h-5 w-5" />
          )}
        </div>
      </div>
    </div>
  )
}
