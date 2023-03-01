import { useMemo, useState } from "react"
import { default as DropDownMenu } from "~components/dropdown-menu"
import { HiChevronDown } from "~icons"
import { classNames } from "~utils"

export type State = {
  secondary: boolean
  checked: boolean
}

export default function StatusSwitch(props: {
  action: string
  state: State
  onChange: (state: State) => void
}) {
  const { action, state, onChange } = props
  const [hoverButton, setHoverButton] = useState(false)
  const [dropDownOpen, setDropDownOpen] = useState(false)

  const showHoverState = useMemo(() => {
    return hoverButton || dropDownOpen
  }, [hoverButton, dropDownOpen])

  return (
    <>
      {state !== undefined ? (
        <div
          className={classNames(
            state.checked
              ? "bg-green-500 text-white hover:bg-green-600"
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
              "px-2.5 py-1.5",
              "flex w-full justify-center"
            )}
            onClick={() => {
              onChange({
                secondary: state.secondary,
                checked: !state.checked
              })
            }}>
            {`${action}${state.checked ? "d" : ""} for this ${
              state.checked && state.secondary ? "page" : "domain"
            }`}
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
              items={[`${action} only for this page`]}
              align="right"
              size="small"
              onSelect={() => {
                onChange({ secondary: true, checked: true })
              }}
              onChange={setDropDownOpen}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
