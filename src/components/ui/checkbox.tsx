import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import styled from "styled-components"

const StyledCheckbox = styled(CheckboxPrimitive.Root)`
  height: 16px;
  width: 16px;
  flex-shrink: 0;
  border-radius: 2px;
  border: 1px solid var(--color-primary);
  background-color: transparent;
  
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(2, 255, 149, 0.3);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  &[data-state="checked"] {
    background-color: var(--color-primary);
    color: black;
  }
`;

const StyledIndicator = styled(CheckboxPrimitive.Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
`;

const StyledCheck = styled(Check)`
  height: 14px;
  width: 14px;
`;

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <StyledCheckbox
    ref={ref}
    className={className}
    {...props}
  >
    <StyledIndicator>
      <StyledCheck />
    </StyledIndicator>
  </StyledCheckbox>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
