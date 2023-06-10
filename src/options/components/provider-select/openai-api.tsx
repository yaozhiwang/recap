import { useStorage } from "@plasmohq/storage/hook"
import {
  defaulOpenaiAPIHost,
  getProviderConfigKey,
  OpenAIProviderConfig,
  ProviderType
} from "~config"
import { SavableInput } from ".."

export default function OpenAIAPIProvider() {
  const [config, setConfig] = useStorage<OpenAIProviderConfig>(
    getProviderConfigKey(ProviderType.OpenaiChatApi)
  )

  return (
    <>
      {config !== undefined ? (
        <div className="flex flex-col gap-0.5">
          <div>
            <label htmlFor="api-key" className="block text-lg font-medium">
              API Key
            </label>
            <p className="text-sm text-neutral-500">
              You can find or create your API key{" "}
              <a
                className="text-blue-600 visited:text-purple-600 hover:text-blue-800 hover:underline"
                href="https://platform.openai.com/account/api-keys">
                here
              </a>
            </p>
          </div>
          <div id="api-key">
            <SavableInput
              type="password"
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              defaultValue={config.apiKey}
              onChange={(newKey) => {
                setConfig({ ...config, apiKey: newKey })
              }}
            />
          </div>
          <div>
            <label htmlFor="api-host" className="block text-lg font-medium">
              API Host
            </label>
          </div>
          <div id="api-host">
            <SavableInput
              type="text"
              placeholder={defaulOpenaiAPIHost}
              defaultValue={config.apiHost}
              onChange={(newHost) => {
                setConfig({ ...config, apiHost: newHost })
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
