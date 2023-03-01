import { Listbox, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { HeadingAnchor } from "~config"
import { HiCheck, HiChevronUpDown } from "~icons"
import { classNames, tagDisplayName } from "~utils"

export default function HeadingAnchorSelect(props: {
  anchor: string
  onUpdate: (newAnchor: string) => void
  size?: "small" | "normal"
}) {
  const { anchor, onUpdate } = props

  return (
    <>
      {anchor != undefined ? (
        <Listbox
          value={anchor}
          onChange={(val) => {
            onUpdate(val)
          }}>
          {({ open }) => (
            <div className="block bg-white text-black dark:bg-neutral-900 dark:text-white">
              <div
                className={classNames(
                  props.size === "small" ? "w-[192]" : "w-[250]",
                  "relative"
                )}>
                <Listbox.Button className="relative w-full cursor-default rounded-md py-1 pl-3 pr-10 text-left text-sm leading-6 shadow-sm ring-1 ring-inset ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:ring-neutral-500 dark:focus:ring-indigo-500">
                  <span className="ml-2 block truncate">
                    {tagDisplayName(anchor)}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                    <HiChevronUpDown
                      className="h-5 w-5 text-neutral-200 dark:text-neutral-500"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0">
                  <Listbox.Options
                    className={classNames(
                      props.size === "small"
                        ? "mt-1 max-h-32 text-xs"
                        : "bottom-full mb-1 max-h-56 text-sm",
                      "absolute z-10 w-full overflow-auto rounded-md bg-white py-1 text-black shadow-lg shadow-neutral-300 ring-1 ring-neutral-300 ring-opacity-5 focus:outline-none dark:bg-neutral-900 dark:text-white"
                    )}>
                    {Object.entries<string>(HeadingAnchor).map(([k, v]) => (
                      <Listbox.Option
                        key={k}
                        className={({ active }) =>
                          classNames(
                            active ? "bg-indigo-600 text-white" : "",
                            "relative cursor-default select-none py-2 pl-3 pr-9"
                          )
                        }
                        value={v}>
                        {({ selected, active }) => (
                          <>
                            <div className="flex items-center">
                              <span
                                className={classNames(
                                  selected ? "font-semibold" : "font-normal",
                                  "ml-3 block truncate"
                                )}>
                                {tagDisplayName(v)}
                              </span>
                            </div>

                            {selected ? (
                              <span
                                className={classNames(
                                  active ? "" : "text-indigo-600",
                                  "absolute inset-y-0 right-0 flex items-center pr-4"
                                )}>
                                <HiCheck
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </div>
          )}
        </Listbox>
      ) : null}
    </>
  )
}
