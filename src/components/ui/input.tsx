import * as React from "react"
import styled from "styled-components"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const StyledInput = styled.input`
  display: flex;
  height: 40px;
  width: 100%;
  border-radius: 6px;
  border: 1px solid var(--color-surface);
  background-color: var(--color-background);
  padding: 0 12px;
  font-size: 14px;
  
  &::file-selector-button {
    border: 0;
    background: transparent;
    font-size: 14px;
    font-weight: 500;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <StyledInput
        type={type}
        className={className}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
