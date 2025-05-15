import { cva } from "class-variance-authority";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Extend o tipo de variante da Badge para incluir 'success'
const extendedBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        premium: "border-transparent bg-amber-500 text-white hover:bg-amber-500/80",
        success: "border-transparent bg-green-500 text-white hover:bg-green-500/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Componente Badge estendido com a variante 'success'
export function ExtendedBadge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "premium" | "success";
}) {
  return (
    <div className={cn(extendedBadgeVariants({ variant }), className)} {...props} />
  );
}