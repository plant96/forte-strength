import { cn } from "cn"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

interface UnitInputProps extends React.ComponentProps<"input"> {
  /** Unit label shown inside the right edge of the input. */
  suffix?: string
  groupClassName?: string
}

/** Numeric text input with an optional unit suffix. */
export function UnitInput({ suffix, groupClassName, ...props }: UnitInputProps) {
  return (
    <InputGroup className={cn("h-10", groupClassName)}>
      <InputGroupInput
        type="text"
        autoComplete="off"
        className="tabular-nums placeholder:text-muted-foreground/45"
        {...props}
      />
      {suffix && (
        <InputGroupAddon align="inline-end">
          <InputGroupText>{suffix}</InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
