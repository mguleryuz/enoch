import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { loaders } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "animate-pop active:scale-95 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-active",
        outline:
          "border border-input bg-background hover:bg-secondary hover:text-secondary-foreground active:bg-secondary-active",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-link underline-offset-4 hover:underline active:text-link-active",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    startIcon?: React.ReactNode
    endIcon?: React.ReactNode
    loading?: boolean
    loader?: "Loader" | "Loader2" | "PinWheel" | "Lucide" | "Icon"
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  startIcon,
  endIcon,
  loading,
  loader = "PinWheel",
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  const Loader = loaders[loader]

  const renderContent = () => {
    const hasChildren = !!children
    const content: React.ReactNode[] = []

    if (startIcon) {
      content.push(
        <span key="start-icon" className={cn(hasChildren && "mr-2")}>
          {startIcon}
        </span>
      )
    }

    if (loading) {
      content.push(
        <Loader
          key="loader"
          className={cn("h-4 w-4 animate-spin", hasChildren && "mr-2")}
        />
      )
    }

    if (hasChildren) {
      content.push(<React.Fragment key="children">{children}</React.Fragment>)
    }

    if (endIcon) {
      content.push(
        <span key="end-icon" className={cn(hasChildren && "ml-2")}>
          {endIcon}
        </span>
      )
    }

    return content.length > 0 ? content : children
  }

  return (
    <Comp
      data-slot="button"
      disabled={loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {renderContent()}
    </Comp>
  )
}

export { Button, buttonVariants }
