import { Slot } from "@radix-ui/react-slot";
import { tv } from "tailwind-variants";

import { cn } from "@/utils/cn";

import type { ComponentProps } from "react";
import type { VariantProps } from "tailwind-variants";

const badgeVariants = tv({
  base: "w-10 inline-flex items-center leading-tight justify-center font-en rounded-md px-2 py-0.5 text-[0.55rem] font-medium whitespace-nowrap shrink-0 transition-[color,box-shadow] overflow-hidden",
  compoundVariants: [
    {
      className: "bg-green-600 text-white",
      type: "get",
      variant: "filled"
    },
    {
      className: "bg-green-400/20 text-green-700 dark:bg-green-400/20 dark:text-green-400",
      type: "get",
      variant: "outline"
    },
    {
      className: "bg-blue-600 text-white",
      type: "post",
      variant: "filled"
    },
    {
      className: "bg-blue-400/20 text-blue-700 dark:bg-blue-400/20 dark:text-blue-400",
      type: "post",
      variant: "outline"
    },
    {
      className: "bg-orange-600 text-white",
      type: "patch",
      variant: "filled"
    },
    {
      className: "bg-orange-400/20 text-orange-700 dark:bg-orange-400/20 dark:text-orange-400",
      type: "patch",
      variant: "outline"
    },
    {
      className: "bg-red-600 text-white",
      type: "delete",
      variant: "filled"
    },
    {
      className: "bg-red-400/20 text-red-700 dark:bg-red-400/20 dark:text-red-400",
      type: "delete",
      variant: "outline"
    },
    {
      className: "bg-purple-600 text-white",
      type: "put",
      variant: "filled"
    },
    {
      className: "bg-purple-400/20 text-purple-700 dark:bg-purple-400/20 dark:text-purple-400",
      type: "put",
      variant: "outline"
    }
  ],
  defaultVariants: {
    type: "get",
    variant: "filled"
  },

  variants: {
    type: {
      delete: "",
      get: "",
      patch: "",
      post: "",
      put: ""
    },
    variant: {
      filled: "",
      outline: ""
    }
  }
});

export default function ApiBadge({
  type,
  variant,
  className,
  asChild = false,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return <Comp className={cn(badgeVariants({ type, variant }), className)} data-slot="badge" {...props} />;
}
