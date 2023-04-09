import { useMemo, useState } from "react"
import { default as DropDownMenu } from "~components/dropdown-menu"
import { ShortcutNames } from "~constants"
import { useShortcuts } from "~hooks"
import { HiChevronDown } from "~icons"
import { classNames } from "~utils"

export type State = {
  secondary: boolean
  checked: boolean
}

export type Action = "Disable" | "Enable"

function oppositeAction(action: Action) {
  if (action === "Disable") {
    return "Enable"
  } else {
    return "Disable"
  }
}

export default function StatusSwitch(props: {
  action: Action
  state: State
  onChange: (state: State) => void
  forcePageChecked: boolean
  onForcePageChange: (checked: boolean) => void
}) {
  const { action, state, onChange, forcePageChecked, onForcePageChange } = props
  const [hoverButton, setHoverButton] = useState(false)
  const [dropDownOpen, setDropDownOpen] = useState(false)

  const [shortcuts] = useShortcuts()
  const toggleEnablePageShortcut = useShortcutString(
    ShortcutNames.ToggleEnablePage
  )
  const toggleEnableHostShortcut = useShortcutString(
    ShortcutNames.ToggleEnableHost
  )

  const showHoverState = useMemo(() => {
    return hoverButton || dropDownOpen
  }, [hoverButton, dropDownOpen])

  function useShortcutString(name: string) {
    return useMemo(() => {
      const command = shortcuts.filter((e) => e.name === name)[0]
      if (!!command && command.shortcut != "") {
        return ` (${command.shortcut})`
      }
      return ""
    }, [shortcuts])
  }

  return (
    <>
      {state !== undefined ? (
        <div className="flex flex-col gap-1">
          <div
            className={classNames(
              state.checked
                ? action === "Enable"
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-orange-500 text-white hover:bg-orange-600"
                : showHoverState
                ? "bg-neutral-200 dark:bg-neutral-700"
                : "",
              "flex w-full cursor-pointer select-none items-center divide-x divide-neutral-300 rounded text-sm dark:divide-neutral-500"
            )}
            onMouseOver={() => {
              setHoverButton(true)
            }}
            onMouseOut={() => {
              setHoverButton(false)
            }}>
            <div
              className={classNames(
                "w-full px-2.5 py-1.5",
                state.checked ? "text-center" : "text-left"
              )}
              onClick={() => {
                onChange({
                  secondary: state.secondary,
                  checked: !state.checked
                })
              }}>
              {(state.checked
                ? `${state.secondary ? "Page" : "Domain"} ${action}d`
                : `${action} this ${state.secondary ? "page" : "domain"}`) +
                (state.secondary
                  ? toggleEnablePageShortcut
                  : toggleEnableHostShortcut)}
            </div>
            <div
              className={classNames(
                state.checked ? "hidden" : "",
                showHoverState ? "visible" : "invisible",
                "text-neutral-400 hover:text-black dark:text-neutral-500 hover:dark:text-white"
              )}>
              <DropDownMenu
                button={
                  <div className="px-2.5 py-1.5">
                    <HiChevronDown className="h-5 w-5" aria-hidden="true" />
                  </div>
                }
                items={[`only ${action} this page${toggleEnablePageShortcut}`]}
                align="right"
                size="small"
                onSelect={() => {
                  onChange({
                    secondary: true,
                    checked: true
                  })
                }}
                onChange={setDropDownOpen}
              />
            </div>
          </div>

          {state.checked && !state.secondary && (
            <div>
              <label className="relative inline-flex w-full cursor-pointer select-none items-center rounded-md px-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-700">
                <div className="relative">
                  <input
                    type="checkbox"
                    value=""
                    className="peer sr-only"
                    checked={forcePageChecked}
                    onChange={(e) => {
                      onForcePageChange(e.target.checked)
                    }}
                  />
                  <div
                    className={classNames(
                      oppositeAction(action) === "Enable"
                        ? "peer-checked:bg-green-500"
                        : "peer-checked:bg-orange-500",
                      "peer h-5 w-9 rounded-full bg-neutral-100 dark:bg-neutral-800",
                      "after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-['']",
                      "peer-checked:after:translate-x-full peer-checked:after:border-white"
                    )}></div>
                </div>
                <span className="ml-3 py-1.5 text-sm font-medium">
                  {`${oppositeAction(
                    action
                  )} this page${toggleEnablePageShortcut}`}
                </span>
              </label>
            </div>
          )}
        </div>
      ) : null}
    </>
  )
}
