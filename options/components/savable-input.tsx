import { useEffect, useRef, useState } from "react"
import { FiEdit, FiSave } from "~icons"
import { classNames } from "~utils"

export default function SavableInput(props: {
  type: string
  placeholder?: string
  errorText?: string
  min?: number
  defaultValue?: number | string
  onChange: (val: string) => void
}) {
  const [editable, setEditable] = useState(false)
  const [valid, setValid] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    if (editable && ref.current) {
      ref.current.focus()
      const val = ref.current.value
      ref.current.value = ""
      ref.current.value = val
    }
  }, [editable])

  return (
    <div className="w-full">
      <div
        className={classNames(
          props.type === "number" ? "w-[120]" : "w-full",
          "relative"
        )}>
        <input
          className={classNames(
            valid
              ? "border-indigo-500 ring-indigo-500 focus:border-indigo-500 focus:ring-indigo-500"
              : "border-red-500 ring-red-600 focus:border-red-500 focus:ring-red-600",
            props.type === "number" ? "w-[120]" : "w-full",
            "block rounded-md bg-neutral-100 text-black shadow-sm placeholder:text-neutral-300",
            "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-white disabled:ring-0",
            "dark:bg-neutral-700 dark:text-white dark:placeholder:text-neutral-500 disabled:dark:border-neutral-500 dark:disabled:bg-neutral-900"
          )}
          type={props.type}
          min={props.min}
          disabled={!editable}
          ref={ref}
          defaultValue={props.defaultValue}
          placeholder={editable ? props.placeholder : ""}
          onInput={(e) => {
            const elem = e.target as HTMLInputElement
            if (props.type === "number") {
              if (elem.value === "" || /[^0-9]+/.test(elem.value)) {
                setValid(false)
              } else {
                setValid(Number(elem.value) >= props.min)
              }
            } else if (props.type === "text") {
              setValid(elem.value !== "")
            }
          }}
        />
        <div className="absolute inset-y-0 right-0 cursor-pointer px-3 text-indigo-600 hover:text-indigo-700 dark:text-indigo-500 dark:hover:text-indigo-600">
          <div
            className={classNames(
              editable ? "hidden" : "flex items-center",
              "h-full"
            )}
            onClick={() => {
              setEditable(true)
            }}>
            <FiEdit
              className={classNames(
                editable
                  ? "bg-neutral-100 dark:bg-neutral-700"
                  : "bg-white dark:bg-neutral-900",
                "h-5 w-5 "
              )}
              aria-hidden="true"
            />
          </div>
          <div
            className={classNames(
              editable && valid ? "flex items-center" : "hidden",
              "h-full"
            )}
            onClick={() => {
              setEditable(false)
              props.onChange(ref.current.value)
            }}>
            <FiSave
              className={classNames(
                editable
                  ? "bg-neutral-100 dark:bg-neutral-700"
                  : "bg-white dark:bg-neutral-900",
                "h-5 w-5 "
              )}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
      <p
        className={classNames(
          !editable || valid ? "invisible" : "visible",
          "text-xs text-red-600"
        )}>
        {props.errorText ?? "Please input a valid value"}
      </p>
    </div>
  )
}
