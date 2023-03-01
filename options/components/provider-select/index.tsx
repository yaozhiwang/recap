import { RadioGroup } from "@headlessui/react"
import { useStorage } from "@plasmohq/storage/hook"
import { ProviderType, providerTypeConfigKey } from "~config"
import { classNames } from "~utils"
import ChatGPTWebAppProvider from "./chatgpt-webapp"
import OpenAIAPIProvider from "./openai-api"

const names = {
  [ProviderType.ChatGPTWebApp]: "ChatGPT WebApp",
  [ProviderType.OpenaiChatApi]: "OpenAI API"
}
const options = Object.entries(ProviderType).map(([key, value]) => ({
  key,
  value,
  name: names[value]
}))

export default function ProviderSelect() {
  const [provider, setProvider] = useStorage<ProviderType>(
    providerTypeConfigKey
  )

  if (provider === undefined) {
    return null
  }

  return (
    <div className="space-y-4 divide-y divide-neutral-200 rounded-lg border border-neutral-200 px-2 pb-4 dark:divide-neutral-500 dark:border-neutral-500">
      <RadioGroup value={provider} onChange={setProvider} className="mx-5 mt-4">
        <div className="flex flex-row gap-5">
          {options.map((option) => (
            <RadioGroup.Option
              key={option.key}
              value={option.value}
              className={({ active, checked }) =>
                classNames(
                  checked
                    ? "border-0 bg-indigo-600 text-white hover:bg-indigo-700"
                    : "border border-neutral-200 hover:bg-neutral-100 dark:border-neutral-500 dark:hover:bg-neutral-800",
                  "flex flex-1 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-md  py-4 px-3 text-sm font-medium"
                )
              }>
              <RadioGroup.Label as="span">{option.name}</RadioGroup.Label>
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>

      {provider === ProviderType.ChatGPTWebApp ? (
        <div className="pt-4">
          <ChatGPTWebAppProvider />
        </div>
      ) : null}

      {provider === ProviderType.OpenaiChatApi ? (
        <div className="pt-4">
          <OpenAIAPIProvider />
        </div>
      ) : null}
    </div>
  )
}
