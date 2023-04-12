import { Menu, Transition } from "@headlessui/react"
import { Fragment, useEffect } from "react"
import { classNames } from "~utils"

export default function DropDownMenu(props: {
  button: React.ReactNode
  items: string[]
  disabled?: boolean
  align?: "left" | "right"
  position?: "top" | "bottom"
  onSelect?: (item: string) => void
  onChange?: (open: boolean) => void
  size?: "small" | "normal"
}) {
  return (
    <Menu as="div" className="relative block">
      {({ open }) => {
        useEffect(() => {
          props.onChange && props.onChange(open)
        }, [open])

        return (
          <>
            <Menu.Button
              className="relative flex items-center"
              disabled={props.disabled}>
              {props.button}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95">
              <Menu.Items
                className={classNames(
                  props.align === "right" ? "right-0 -ml-1" : "left-0 -mr-1",
                  props.position === "top" ? "bottom-full mb-2" : "mt-2",
                  "absolute z-10 w-max origin-top-right rounded-md bg-white text-black shadow-lg shadow-neutral-300 ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-900 dark:text-white"
                )}>
                <div className="py-1">
                  {props.items.map((item) => (
                    <Menu.Item key={item}>
                      {({ active }) => (
                        <div
                          className={classNames(
                            active ? "bg-indigo-600 text-white" : "",
                            props.size == "small"
                              ? "py-1 px-2 text-xs"
                              : "py-2 px-4 text-sm",
                            "block select-none"
                          )}
                          onClick={(e) => {
                            props.onSelect && props.onSelect(item)
                          }}>
                          {item}
                        </div>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </>
        )
      }}
    </Menu>
  )
}
