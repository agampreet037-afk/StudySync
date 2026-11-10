import { forwardRef, type ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IconActionProps extends Omit<ComponentProps<typeof Button>, "children"> {
  icon: LucideIcon;
  label: string;
}

/** Icon-only button with a tooltip and an accessible label. */
export const IconAction = forwardRef<HTMLButtonElement, IconActionProps>(
  ({ icon: Icon, label, className, variant = "ghost", ...props }, ref) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          variant={variant}
          size="icon"
          aria-label={label}
          className={cn("size-8 text-muted-foreground hover:text-foreground", className)}
          {...props}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  ),
);
IconAction.displayName = "IconAction";
