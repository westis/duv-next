import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Swiss Grid buttons (design-system/components/Button.md): square, condensed
 * uppercase labels. `primary` is the one red action on a view, `ink` a strong
 * action that should not compete with red, `secondary` an outline in
 * control-border, `ghost` for clear and close. The older shadcn names map onto
 * these: default → primary, outline → secondary.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border border-transparent font-display leading-none font-bold tracking-[0.05em] uppercase transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "border-brand bg-brand text-brand-fg hover:bg-brand/90",
        default: "border-brand bg-brand text-brand-fg hover:bg-brand/90",
        ink: "border-fg bg-fg text-surface hover:bg-fg/90",
        secondary: "border-control-border bg-transparent text-fg hover:bg-surface-muted",
        outline: "border-control-border bg-transparent text-fg hover:bg-surface-muted",
        ghost: "bg-transparent px-2 text-fg hover:bg-surface-muted",
        destructive: "border-danger bg-danger text-brand-fg hover:bg-danger/90",
        link: "border-0 font-sans font-normal tracking-normal normal-case text-link underline-offset-4 hover:underline",
      },
      size: {
        md: "min-h-11 px-5 text-base",
        default: "min-h-11 px-5 text-base",
        sm: "min-h-9 px-3 text-[0.9375rem]",
        lg: "min-h-12 px-6 text-lg",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
