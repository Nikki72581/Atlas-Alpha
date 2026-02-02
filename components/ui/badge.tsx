import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-border bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
        destructive:
          "border-transparent bg-[oklch(0.55_0.22_25/0.12)] text-[oklch(0.45_0.20_25)] dark:bg-[oklch(0.60_0.20_25/0.18)] dark:text-[oklch(0.80_0.15_25)] [a&]:hover:bg-[oklch(0.55_0.22_25/0.18)]",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-[oklch(0.55_0.15_155/0.12)] text-[oklch(0.40_0.14_155)] dark:bg-[oklch(0.60_0.15_155/0.18)] dark:text-[oklch(0.75_0.12_155)] [a&]:hover:bg-[oklch(0.55_0.15_155/0.18)]",
        warning:
          "border-transparent bg-[oklch(0.70_0.15_70/0.12)] text-[oklch(0.45_0.14_70)] dark:bg-[oklch(0.72_0.14_70/0.18)] dark:text-[oklch(0.85_0.12_70)] [a&]:hover:bg-[oklch(0.70_0.15_70/0.18)]",
        info:
          "border-transparent bg-[oklch(0.55_0.12_230/0.12)] text-[oklch(0.40_0.12_230)] dark:bg-[oklch(0.60_0.12_230/0.18)] dark:text-[oklch(0.75_0.10_230)] [a&]:hover:bg-[oklch(0.55_0.12_230/0.18)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
