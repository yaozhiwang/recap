import { useMemo, useState } from "react"
import { default as DropDownMenu } from "~components/dropdown-menu"
import { ArticleContainer } from "~config"
import {
  HiOutlinePlusCircle as AddIcon,
  HiOutlineX as DeleteIcon,
  TbReplace as RepaceIcon
} from "~icons"
import { classNames, tagDisplayName } from "~utils"

export default function ArticleContainerStep(props: {
  containers: string[]
  onUpdate: (newContainers: string[]) => void
  size?: "small" | "normal"
}) {
  const { containers, onUpdate } = props

  const [replaceMenuOpen, setReplaceMenuOpen] = useState(false)

  const notAdded = useMemo(() => {
    if (containers == undefined) {
      return []
    }
    return Object.values(ArticleContainer).filter(
      (e) => containers.indexOf(e) < 0
    )
  }, [containers])

  function onAdd(container: string) {
    const arr = [...containers]
    arr.push(container)
    onUpdate(arr)
  }

  function onReplace(container: string) {
    onUpdate([container])
  }

  function onDelete(idx: number) {
    const arr = [...containers]
    arr.splice(idx, 1)
    onUpdate(arr)
  }

  return (
    <>
      {containers != undefined ? (
        <div
          className={classNames(
            props.size === "small" ? "text-xs" : "text-sm",
            "flex flex-row gap-2"
          )}>
          {containers != undefined ? (
            <div className="flex w-max select-none divide-y-0 divide-neutral-300 rounded-md border border-neutral-200 dark:border-neutral-500">
              {containers.map((container, idx) => (
                <div key={container} className="relative flex flex-row">
                  <span className="flex items-center px-1 py-1 font-medium">
                    <span
                      className={classNames(
                        replaceMenuOpen
                          ? "border-red-500 bg-red-300"
                          : "hover:border-red-500 hover:bg-red-300",
                        "group flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-200 text-xs text-neutral-500 dark:border-neutral-500 dark:text-neutral-400"
                      )}>
                      <span
                        className={classNames(
                          replaceMenuOpen
                            ? "hidden"
                            : "inline group-hover:hidden"
                        )}>
                        {idx + 1}
                      </span>
                      <span
                        className={classNames(
                          replaceMenuOpen
                            ? "inline"
                            : "hidden group-hover:inline",
                          "text-red-600"
                        )}>
                        {containers.length == 1 ? (
                          <DropDownMenu
                            button={<RepaceIcon />}
                            items={notAdded}
                            size={props.size}
                            align="left"
                            onSelect={onReplace}
                            onChange={setReplaceMenuOpen}
                          />
                        ) : (
                          <button
                            className="flex items-center"
                            onClick={() => onDelete(idx)}>
                            <DeleteIcon />
                          </button>
                        )}
                      </span>
                    </span>
                    <span className="ml-1 font-medium">
                      {tagDisplayName(container)}
                    </span>
                  </span>

                  {idx !== containers.length - 1 ? (
                    <div className="block h-8 w-5" aria-hidden="true">
                      <svg
                        className="h-full w-full text-neutral-200 dark:text-neutral-500"
                        viewBox="0 0 22 80"
                        fill="none"
                        preserveAspectRatio="none">
                        <path
                          d="M0 -2L20 40L0 82"
                          vectorEffect="non-scaling-stroke"
                          stroke="currentcolor"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          {containers.length < Object.keys(ArticleContainer).length ? (
            <div className="flex items-center justify-center text-neutral-200 hover:text-black dark:text-neutral-500 hover:dark:text-white">
              <DropDownMenu
                button={<AddIcon className="h-6 w-6" />}
                items={notAdded}
                size={props.size}
                align="left"
                onSelect={onAdd}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
