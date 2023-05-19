import { useStorage } from "@plasmohq/storage/hook"
import { useMemo, useState } from "react"
import {
  ConfigKeys,
  defaultPrompt,
  getDefaultPrompt,
  getPromptText,
  hasOutlineForm,
  parseDefaultPrompt,
  Prompt
} from "~config"
import { HiOutlineCheckCircle, HiOutlineLightBulb, MdSettingsBackupRestore } from "~icons"
import SavableInput from "./savable-input"

export default function PromptInput() {
  const [prompt, setPrompt] = useStorage<Prompt>(ConfigKeys.prompt)
  const [isEditing, setIsEditing] = useState(false)
  const [language, setLanguage] = useState("")

  const promptText = useMemo(() => {
    return getPromptText(prompt)
  }, [prompt])

  const [isDefault] = useMemo(() => {
    return parseDefaultPrompt(promptText)
  }, [prompt])

  const outlineForm = useMemo(() => {
    return hasOutlineForm(promptText)
  }, [prompt])

  const restoreDefault = () => {
    setPrompt(defaultPrompt)
  }

  const onChangeLanguage = (language: string) => {
    setPrompt(getDefaultPrompt({ prompt, language }))
    setLanguage("")
  }

  const onChangeOutline = (checked: boolean) => {
    setPrompt(getDefaultPrompt({ prompt, outlineForm: checked }))
  }

  const onEditPromptText = (text: string) => {
    const [isDefault, prompt] = parseDefaultPrompt(text)
    if (isDefault) {
      setPrompt(prompt)
    } else {
      setPrompt({ template: text, params: {} })
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="w-[650px]">
        <SavableInput
          type="text"
          defaultValue={promptText}
          onChange={onEditPromptText}
          onEdit={setIsEditing}
          value={promptText}
          validate={(text) => {
            return text.includes("{content}")
          }}
          errorText={"Prompt must includes '{content}'"}
        />
      </div>
      {!isEditing && (
        <div className="flex flex-col gap-2">
          <button
            className="flex w-fit flex-row items-center rounded-md border px-2 py-2 text-xs enabled:border-neutral-200 enabled:hover:border-transparent
          enabled:hover:bg-indigo-600 enabled:hover:text-white disabled:cursor-not-allowed disabled:border-transparent
          disabled:bg-indigo-600 disabled:text-white disabled:hover:bg-indigo-600 dark:hover:bg-indigo-600 enabled:dark:border-neutral-500
          enabled:dark:hover:border-transparent disabled:dark:hover:bg-indigo-600"
            disabled={isDefault}
            onClick={() => {
              restoreDefault()
            }}>
            {isDefault ? (
              "Using Defalut Prompt"
            ) : (
              <>
                <MdSettingsBackupRestore className="inline h-4 w-4" />
                Restore Default Prompt
              </>
            )}
          </button>
          {isDefault && (
            <div
              className="flex flex-col gap-2 rounded-md
            border border-neutral-200 p-2 dark:border-neutral-500">
              <div className="flex flex-row items-center gap-1">
                <label className="relative inline-flex cursor-pointer items-center gap-2">
                  <span className="text-sm font-medium">Language:</span>
                  <input
                    type="text"
                    placeholder="Not Specified"
                    className="w-28 rounded-md bg-neutral-100 px-2 py-1 text-sm
                      placeholder:text-neutral-300 dark:bg-neutral-700 dark:placeholder:text-neutral-500"
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value)
                    }}
                  />
                </label>
                <button
                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-600"
                  onClick={() => {
                    onChangeLanguage(language)
                  }}>
                  <HiOutlineCheckCircle className="h-5 w-5" />
                </button>
                <div className="inline-flex flex-row text-xs font-light text-neutral-500 items-center gap-1 ml-3">
                  <HiOutlineLightBulb className="h-5 w-5 inline" />
                  You can replace the entire prompt with your own language.
                </div>
              </div>
              <div className="flex flex-row items-center">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    value=""
                    checked={outlineForm}
                    onChange={(e) => onChangeOutline(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-9 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:border-neutral-600 dark:bg-neutral-700 dark:peer-focus:ring-indigo-800"></div>
                  <span className="ml-3 text-sm font-medium">Outline form</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
