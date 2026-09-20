"use client"

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

/** Search box that keeps `?q=` in the URL (debounced) and resets to page 1. */
export function SearchInput({ placeholder, label }: { placeholder: string; label: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") ?? ""
  const [draft, setDraft] = useState({ query, value: query })
  const [isPending, startTransition] = useTransition()
  const timeout = useRef<number | undefined>(undefined)

  // Back/forward navigation can change the URL without remounting this input.
  // Updating this component's own state during render keeps its focus intact.
  if (draft.query !== query) setDraft({ query, value: query })
  const value = draft.query === query ? draft.value : query

  useEffect(() => () => window.clearTimeout(timeout.current), [query])

  function update(next: string) {
    setDraft({ query, value: next })
    window.clearTimeout(timeout.current)
    timeout.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.trim()) params.set("q", next.trim())
      else params.delete("q")
      params.delete("page")
      const query = params.toString()
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname))
    }, 300)
  }

  return (
    <InputGroup className="h-10 bg-card">
      <InputGroupAddon align="inline-start">
        {isPending ? (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <SearchIcon className="size-4 text-muted-foreground" />
        )}
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={value}
        onChange={(event) => update(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="placeholder:text-muted-foreground/60 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => update("")}>
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
