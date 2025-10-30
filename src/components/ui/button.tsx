import { Slot } from "@radix-ui/react-slot";
import { IconLoader2 } from "@tabler/icons-react";
import { tv } from "tailwind-variants";

import { cn } from "@/utils/cn";

import type { ComponentProps } from "react";
import type { VariantProps } from "tailwind-variants";

const buttonVariants = tv({
  base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',

  compoundVariants: [
    // Primary variants
    {
      class: "bg-brand-primary text-white hover:bg-brand-primary/90",
      color: "primary",
      variant: "default"
    },
    {
      class: "bg-brand-primary text-white hover:bg-brand-primary/90",
      color: "primary",
      variant: "filled"
    },
    {
      class: "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20",
      color: "primary",
      variant: "light"
    },
    {
      class: "border border-brand-primary text-brand-primary hover:bg-brand-primary/10",
      color: "primary",
      variant: "outline"
    },
    {
      class: "text-brand-primary underline-offset-4 hover:underline",
      color: "primary",
      variant: "link"
    },
    {
      class: "text-brand-primary hover:bg-brand-primary/10",
      color: "primary",
      variant: "transparent"
    },

    // Secondary variants
    {
      class: "bg-gray-600 text-white hover:bg-gray-600/90",
      color: "secondary",
      variant: "default"
    },
    {
      class: "bg-gray-600 text-white hover:bg-gray-600/90",
      color: "secondary",
      variant: "filled"
    },
    {
      class: "bg-gray-600/10 text-gray-600 hover:bg-gray-600/20",
      color: "secondary",
      variant: "light"
    },
    {
      class: "border border-gray-600 text-gray-600 hover:bg-gray-600/10",
      color: "secondary",
      variant: "outline"
    },
    {
      class: "text-gray-600 underline-offset-4 hover:underline",
      color: "secondary",
      variant: "link"
    },
    {
      class: "text-gray-600 hover:bg-gray-600/10",
      color: "secondary",
      variant: "transparent"
    },

    // Error variants
    {
      class: "bg-red-500 text-white hover:bg-red-500/90",
      color: "error",
      variant: "default"
    },
    {
      class: "bg-red-500 text-white hover:bg-red-500/90",
      color: "error",
      variant: "filled"
    },
    {
      class: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
      color: "error",
      variant: "light"
    },
    {
      class: "border border-red-500 text-red-500 hover:bg-red-500/10",
      color: "error",
      variant: "outline"
    },
    {
      class: "text-red-500 underline-offset-4 hover:underline",
      color: "error",
      variant: "link"
    },
    {
      class: "text-red-500 hover:bg-red-500/10",
      color: "error",
      variant: "transparent"
    },

    // Success variants
    {
      class: "bg-green-500 text-white hover:bg-green-500/90",
      color: "success",
      variant: "default"
    },
    {
      class: "bg-green-500 text-white hover:bg-green-500/90",
      color: "success",
      variant: "filled"
    },
    {
      class: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
      color: "success",
      variant: "light"
    },
    {
      class: "border border-green-500 text-green-500 hover:bg-green-500/10",
      color: "success",
      variant: "outline"
    },
    {
      class: "text-green-500 underline-offset-4 hover:underline",
      color: "success",
      variant: "link"
    },
    {
      class: "text-green-500 hover:bg-green-500/10",
      color: "success",
      variant: "transparent"
    },

    // Warning variants
    {
      class: "bg-orange-500 text-white hover:bg-orange-500/90",
      color: "warning",
      variant: "default"
    },
    {
      class: "bg-orange-500 text-white hover:bg-orange-500/90",
      color: "warning",
      variant: "filled"
    },
    {
      class: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
      color: "warning",
      variant: "light"
    },
    {
      class: "border border-orange-500 text-orange-500 hover:bg-orange-500/10",
      color: "warning",
      variant: "outline"
    },
    {
      class: "text-orange-500 underline-offset-4 hover:underline",
      color: "warning",
      variant: "link"
    },
    {
      class: "text-orange-500 hover:bg-orange-500/10",
      color: "warning",
      variant: "transparent"
    },

    // Info variants
    {
      class: "bg-blue-500 text-white hover:bg-blue-500/90",
      color: "info",
      variant: "default"
    },
    {
      class: "bg-blue-500 text-white hover:bg-blue-500/90",
      color: "info",
      variant: "filled"
    },
    {
      class: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
      color: "info",
      variant: "light"
    },
    {
      class: "border border-blue-500 text-blue-500 hover:bg-blue-500/10",
      color: "info",
      variant: "outline"
    },
    {
      class: "text-blue-500 underline-offset-4 hover:underline",
      color: "info",
      variant: "link"
    },
    {
      class: "text-blue-500 hover:bg-blue-500/10",
      color: "info",
      variant: "transparent"
    },
    // Default variants
    {
      class: "bg-gray-900 text-white hover:bg-gray-900/90",
      color: "default",
      variant: "default"
    },
    {
      class: "bg-gray-900 text-white hover:bg-gray-900/90",
      color: "default",
      variant: "filled"
    },
    {
      class: "bg-gray-900/10 text-gray-900 hover:bg-gray-900/20",
      color: "default",
      variant: "light"
    },
    {
      class: "border border-gray-900 text-gray-900 hover:bg-gray-900/10",
      color: "default",
      variant: "outline"
    },
    {
      class: "text-gray-900 underline-offset-4 hover:underline",
      color: "default",
      variant: "link"
    },
    {
      class: "bg-transparent text-gray-900 hover:bg-gray-900/10",
      color: "default",
      variant: "transparent"
    }
  ],

  defaultVariants: {
    color: "primary",
    size: "md",
    variant: "default"
  },

  variants: {
    color: { default: "", error: "", info: "", primary: "", secondary: "", success: "", warning: "" },
    size: {
      icon: "size-10",
      lg: "h-11 rounded-md px-8 text-lg",
      md: "h-10 rounded-md px-4",
      sm: "h-9 rounded-md px-4 text-xs",
      xs: "h-8 rounded-md px-3 text-xs"
    },
    variant: { default: "", filled: "", light: "", link: "", outline: "", transparent: "" }
  }
});

function Button({
  size,
  variant,
  children,
  className,
  asChild = false,
  loading = false,
  disabled = false,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ className, size, variant }))}
      data-slot="button"
      disabled={disabled || loading}
      {...props}
    >
      {loading && <IconLoader2 className="mt-1 animate-spin" />}
      {children}
    </Comp>
  );
}

export { Button };
