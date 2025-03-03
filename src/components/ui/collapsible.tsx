"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import styled from "styled-components"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.Trigger

const StyledContent = styled(CollapsiblePrimitive.Content)`
  overflow: hidden;
  &[data-state="closed"] {
    animation: collapsibleUp 0.2s ease-out;
  }
  &[data-state="open"] {
    animation: collapsibleDown 0.2s ease-out;
  }
  
  @keyframes collapsibleUp {
    from {
      height: var(--radix-collapsible-content-height);
    }
    to {
      height: 0;
    }
  }
  
  @keyframes collapsibleDown {
    from {
      height: 0;
    }
    to {
      height: var(--radix-collapsible-content-height);
    }
  }
`;

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <StyledContent
    ref={ref}
    className={className}
    {...props}
  >
    <div style={{ padding: 0 }}>{children}</div>
  </StyledContent>
))
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
