import { CgMoreO, CgMoreVerticalO, RiArticleLine } from "~icons"

export default function SummarizeButton(props: {
  settingsOpen: boolean
  onSettingsOpen: (open: boolean) => void
  onSummarizePage: () => void
}) {
  return (
    <div className="flex w-full flex-col">
      <div className="relative pr-8">
        <button
          className="flex w-full justify-center rounded-md border border-transparent px-2.5 py-1.5 text-sm text-black hover:bg-neutral-200 dark:text-white dark:hover:bg-neutral-700"
          onClick={() => {
            props.onSummarizePage()
          }}>
          <div className="inline-flex items-center">
            <RiArticleLine
              className="-ml-0.5 mr-2 h-4 w-4"
              aria-hidden="true"
            />
            Summarize this page
          </div>
        </button>
        <div
          className="absolute top-0 right-0 flex h-full items-center hover:text-slate-500 dark:hover:text-slate-400"
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
