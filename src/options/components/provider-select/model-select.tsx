import { Listbox, Transition } from "@headlessui/react"
import { useStorage } from "@plasmohq/storage/hook"
import { Fragment, useEffect, useState } from "react"
import {
  getProviderConfigKey,
  OpenAIProviderConfig,
  ProviderType
} from "~config"
import { HiCheck, HiChevronUpDown } from "~icons"
import { classNames } from "~utils"

export default function ModelSelect() {
  const [models, setModels] = useState<string[]>([])
  const [error, setError] = useState(false)
  const [config, setConfig] = useStorage<OpenAIProviderConfig>(
    getProviderConfigKey(ProviderType.OpenaiChatApi)
  )

  useEffect(() => {
    if (!config) {
      return
    }

    ;(async () => {
      try {
        const resp = await fetch(`${config.apiHost}/v1/models`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config.apiKey}`
          }
        })
        if (!resp.ok) {
          setError(true)
        }
        const data = await resp.json().catch(() => {
          setError(true)
        })

        // https://platform.openai.com/docs/models/model-endpoint-compatibility
        const chatModels = []
        for (const model of data.data) {
          if (
            model.id.startsWith("gpt-3.5-turbo") ||
            model.id.startsWith("gpt-4")
          ) {
            chatModels.push(model.id)
          }
        }
        setModels(chatModels)
        setError(false)
      } catch (err) {
        setError(true)
      }
    })()
  }, [config])

  if (!config) {
    return null
  }

  return (
    <div className="flex flex-col gap-1">
      <Listbox
        value={config.model}
        onChange={(model) => {
          setConfig({ ...config, model })
        }}>
        {({ open }) => (
          <div className="block bg-white text-black dark:bg-neutral-900 dark:text-white">
            <div className="relative w-[250]">
              <Listbox.Button className="relative w-full cursor-default rounded-md py-1 pl-3 pr-10 text-left text-sm leading-6 shadow-sm ring-1 ring-inset ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:ring-neutral-500 dark:focus:ring-indigo-500">
                <span className="ml-2 block truncate">{config.model}</span>
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
                <Listbox.Options className="absolute z-10 mt-1 max-h-32 w-full overflow-auto rounded-md bg-white py-1 text-xs text-black shadow-lg shadow-neutral-300 ring-1 ring-neutral-300 ring-opacity-5 focus:outline-none dark:bg-neutral-900 dark:text-white">
                  {models.map((model) => (
                    <Listbox.Option
                      key={model}
                      className={({ active }) =>
                        classNames(
                          active ? "bg-indigo-600 text-white" : "",
                          "relative cursor-default select-none py-2 pl-3 pr-9"
                        )
                      }
                      value={model}>
                      {({ selected, active }) => (
                        <>
                          <div className="flex items-center">
                            <span
                              className={classNames(
                                selected ? "font-semibold" : "font-normal",
                                "ml-3 block truncate"
                              )}>
                              {model}
                            </span>
                          </div>

                          {selected ? (
                            <span
                              className={classNames(
                                active ? "" : "text-indigo-600",
                                "absolute inset-y-0 right-0 flex items-center pr-4"
                              )}>
                              <HiCheck className="h-5 w-5" aria-hidden="true" />
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
      {error && (
        <div className="text-xs text-red-600">
          <p>
            Failed to get model list, please check your network or API Host/API
            Key setting.
          </p>
          <p>Will use model: {config.model}</p>
        </div>
      )}
    </div>
  )
}
