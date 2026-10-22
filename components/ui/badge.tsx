import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border px-1.5 py-0.5 font-display text-[0.8125rem] leading-none font-bold tracking-[0.04em] uppercase",
  {
    variants: {
      variant: {
        default:
          "border-brand bg-brand text-brand-fg",
        secondary:
          "border-fg bg-fg text-surface",
        destructive:
          "border-danger bg-transparent text-danger",
        outline: "border-control-border text-fg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
