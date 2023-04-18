import { useEffect, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import { SummaryContent, SummaryStatus } from "~contents/hooks/summary-content"
import { HiCheck as CopiedIcon, TbCopy as CopyIcon } from "~icons"
import { ProviderErrorCode } from "~provider/errors"
import { classNames } from "~utils"

export default function ResultTextArea(props: { content: SummaryContent }) {
  const { content } = props
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (copied) {
      setTimeout(() => setCopied(false), 1000)
    }
  }, [copied])

  if (content?.status == SummaryStatus.Loading) {
    return (
      <div className="p-6 text-center">
        <div role="status">
          <svg
            aria-hidden="true"
            className="mr-2 inline h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    )
  } else if (content?.status == SummaryStatus.Error) {
    if (
      content.data.code === ProviderErrorCode.CHATGPT_CLOUDFLARE ||
      content.data.code === ProviderErrorCode.CHATGPT_UNAUTHORIZED
    ) {
      return (
        <div className="p-6">
          Please login and pass Cloudflare check at{" "}
          <a
            className="underline"
            href="https://chat.openai.com"
            target="_blank"
            rel="noreferrer">
            chat.openai.com
          </a>
          <span className="mt-2 block text-xs italic">
            OpenAI requires passing a security check every once in a while. If
            this keeps happening, change AI provider to OpenAI API in the
            extension options.
          </span>
        </div>
      )
    }
    return <div className="p-6 text-red-500">{content.data.message}</div>
  }
  return (
    <div className="group relative h-full overflow-hidden ">
      <div
        className={classNames(
          copied ? "visible" : "invisible group-hover:visible",
          "absolute top-2 right-2"
        )}>
        {!!content?.data && (
          <CopyToClipboard
            text={content?.data}
            onCopy={() => {
              setCopied(true)
            }}>
            <button
              className={classNames(
                copied
                  ? "border-green-500 text-green-500"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-500 dark:text-neutral-400 dark:hover:border-neutral-400",
                "rounded-md border bg-white p-1 dark:bg-neutral-900"
              )}>
              {copied ? (
                <CopiedIcon className="h-6 w-6" />
              ) : (
                <CopyIcon className="h-6 w-6" />
              )}
            </button>
          </CopyToClipboard>
        )}
      </div>

      <div className="h-full overflow-y-scroll px-4 py-6">
        <ReactMarkdown rehypePlugins={[[rehypeHighlight, { detect: true }]]}>
          {content?.data}
        </ReactMarkdown>
      </div>
    </div>
  )
}