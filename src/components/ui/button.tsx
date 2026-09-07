import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-signal-open text-navy-950 hover:bg-signal-open/90 shadow-[0_10px_30px_-12px_rgba(34,197,94,0.7)]",
        outline: "border border-line bg-transparent text-ink hover:border-ink-faint hover:bg-navy-700/60",
        ghost: "text-ink-muted hover:bg-navy-700/60 hover:text-ink",
        danger: "bg-signal-blocked/15 text-signal-blocked border border-signal-blocked/40 hover:bg-signal-blocked/25",
        subtle: "bg-navy-700/70 text-ink hover:bg-navy-600/70 border border-line",
      },
      size: {
        sm: "h-8 px-3 text-[12.5px]",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
export { buttonVariants };
