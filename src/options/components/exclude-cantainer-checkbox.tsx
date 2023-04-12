import { ExcludeContainer } from "~config"
import { classNames, tagDisplayName } from "~utils"

export default function ExcludeCantainerCheckBox(props: {
  excludes: string[]
  onUpdate: (newExcludes: string[]) => void
  size?: "small" | "normal"
}) {
  const { excludes, onUpdate } = props

  return (
    <>
      {excludes != undefined ? (
        <fieldset className="flex flex-row gap-2">
          {Object.entries<string>(ExcludeContainer).map(([k, v]) => (
            <div className="relative flex items-start" key={k}>
              <div className="flex h-5 items-center">
                <input
                  id={k}
                  type="checkbox"
                  checked={excludes.indexOf(v) > -1}
                  className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newExcludes = [].concat(excludes)
                      newExcludes.push(v)
                      onUpdate(newExcludes.sort())
                    } else {
                      onUpdate(excludes.filter((e) => e !== v))
                    }
                  }}
                />
              </div>
              <div
                className={classNames(
                  props.size === "small" ? "text-xs" : "text-sm",
                  "ml-1"
                )}>
                <label
                  htmlFor={k}
                  className="font-medium hover:text-slate-500 dark:hover:text-slate-400">
                  {tagDisplayName(v)}
                </label>
              </div>
            </div>
          ))}
        </fieldset>
      ) : null}
    </>
  )
}
