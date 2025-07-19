import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all duration-500 relative"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    >
      {/* Shimmer animation overlay when progress is not 100% */}
      {value !== 100 && (
        <span
          className="absolute inset-0 w-full h-full pointer-events-none animate-progress-shimmer bg-[linear-gradient(120deg,rgba(255,255,255,0.15)_25%,rgba(255,255,255,0.35)_50%,rgba(255,255,255,0.15)_75%)] bg-[length:200%_100%] rounded-full"
        />
      )}
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
