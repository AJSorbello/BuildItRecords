#!/bin/bash
# This script helps migrate MUI components to ShadCN UI

# Exit on error
set -e

echo "MUI to ShadCN UI Migration Helper"
echo "================================="

# Check if a component name is provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 <component-name>"
  echo "Available components:"
  echo "  button, sheet, card, dialog, input, select, checkbox, toggle, tabs, accordion, etc."
  exit 1
fi

COMPONENT=$1
COMPONENT_LOWER=$(echo $COMPONENT | tr '[:upper:]' '[:lower:]')

echo "Installing $COMPONENT component..."

# Install the required Radix UI dependencies
case $COMPONENT_LOWER in
  "button")
    echo "Adding Button component"
    # Button is already installed
    ;;
  "sheet")
    echo "Adding Sheet component"
    # Sheet is already installed
    ;;
  "card")
    echo "Adding Card component"
    bun add @radix-ui/react-card
    ;;
  "dialog")
    echo "Adding Dialog component"
    # Dialog already installed for Sheet
    ;;
  "input")
    echo "Adding Input component"
    bun add @radix-ui/react-form
    ;;
  "select")
    echo "Adding Select component"
    bun add @radix-ui/react-select
    ;;
  "checkbox")
    echo "Adding Checkbox component"
    bun add @radix-ui/react-checkbox
    ;;
  "toggle")
    echo "Adding Toggle component"
    bun add @radix-ui/react-toggle
    ;;
  "tabs")
    echo "Adding Tabs component"
    bun add @radix-ui/react-tabs
    ;;
  "accordion")
    echo "Adding Accordion component"
    bun add @radix-ui/react-accordion
    ;;
  *)
    echo "Component $COMPONENT not recognized"
    exit 1
    ;;
esac

echo "Component installed successfully!"
echo ""
echo "Next steps:"
echo "1. Create the component file in src/components/ui/$COMPONENT_LOWER.tsx"
echo "2. Update imports in your code from MUI to ShadCN UI"
echo "3. Replace MUI component usage with ShadCN UI component"
echo ""
echo "For more details, refer to the MUI_TO_SHADCN_MIGRATION.md guide"
