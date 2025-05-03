import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  responsive,
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & { responsive?: boolean }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn(
        "flex flex-col gap-2",
        responsive
          ? '[&_[role="tablist"]]:h-max [&_[role="tablist"]]:w-full [&_[role="tablist"]]:flex-wrap'
          : '[&_[role="tablist"]]:h-10',
        responsive && '[&_[role="tab"]]:flex-1',
        className
      )}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-background text-muted border-border inline-flex items-center justify-center rounded-lg border p-1",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-secondary hover:data-[state=active]:bg-secondary-hover active:data-[state=active]:bg-secondary-active",
        "data-[state=active]:text-secondary-foreground data-[state=active]:shadow-sm",
        "text-muted hover:data-[state=inactive]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
