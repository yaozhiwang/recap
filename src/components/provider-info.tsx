import { useProviderType, ProviderTypeName } from "~config/provider"
import { useOptionsUrl } from "~hooks/options-url"

export default function ProviderInfo() {
  const [optionsUrl] = useOptionsUrl()
  const [providerType] = useProviderType()

  return (
    <div className="w-full bg-neutral-200 px-2 py-2 text-right text-xs text-neutral-400 dark:bg-neutral-800">
      <span>{`Using `}</span>
      <a
        className="text-black underline dark:text-white"
        href={`${optionsUrl}#provider`}
        target="_blank"
        rel="noreferrer">{`${ProviderTypeName[providerType]}`}</a>
    </div>
  )
}
