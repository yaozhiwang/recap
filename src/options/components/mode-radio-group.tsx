import { RadioGroup } from "@headlessui/react"
import { useStorage } from "@plasmohq/storage/hook"
import { ConfigKeys, Mode } from "~config"
import { HiCheckCircle } from "~icons"
import { classNames } from "~utils"

const options = [
  {
    id: Mode.Active,
    name: "Active",
    description: "Enable Recap by default, disable particular domains mamually"
  },
  {
    id: Mode.Passive,
    name: "Passive",
    description: "Disable Recap by default, enable particular domains mamually"
  }
]

export default function ModeRadioGroup() {
  const [selected, setSelected] = useStorage(ConfigKeys.mode)

  return (
    <>
      {selected != undefined ? (
        <RadioGroup value={selected} onChange={setSelected}>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            {options.map((option) => (
              <RadioGroup.Option
                key={option.id}
                value={option.id}
                className={({ checked, active }) =>
                  classNames(
                    checked
                      ? "border-transparent"
                      : "border-neutral-200 dark:border-neutral-500",
                    active ? "border-indigo-500 ring-2 ring-indigo-500" : "",
                    "relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none"
                  )
                }>
                {({ checked, active }) => (
                  <>
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <RadioGroup.Label
                          as="span"
                          className="block text-sm font-medium">
                          {option.name}
                        </RadioGroup.Label>
                        <RadioGroup.Description
                          as="span"
                          className="mt-1 flex items-center text-sm text-neutral-500">
                          {option.description}
                        </RadioGroup.Description>
                      </span>
                    </span>
                    <HiCheckCircle
                      className={classNames(
                        !checked ? "invisible" : "",
                        "h-5 w-5 text-indigo-600"
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={classNames(
                        active ? "border" : "border-2",
                        checked ? "border-indigo-500" : "border-transparent",
                        "pointer-events-none absolute -inset-px rounded-lg"
                      )}
                      aria-hidden="true"
                    />
                  </>
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
      ) : null}
    </>
  )
}
