# Material UI to ShadCN UI Migration Guide

This document outlines the steps to migrate your BuildItRecords project from Material UI (MUI) to ShadCN UI.

## Table of Contents

1. [Introduction](#introduction)
2. [Setup & Installation](#setup--installation)
3. [Component Migration Guide](#component-migration-guide)
4. [Theme Migration](#theme-migration)
5. [Migration Strategy](#migration-strategy)
6. [Common Issues](#common-issues)

## Introduction

ShadCN UI is a collection of reusable components built with Radix UI and Tailwind CSS. It's not a component library but a collection of components that you can copy and paste into your project, giving you complete control over their implementation.

Benefits of migrating from MUI to ShadCN UI:
- More flexibility and customization
- Smaller bundle size
- Better performance
- Simpler styling system using Tailwind CSS
- Fewer dependency conflicts

## Setup & Installation

### 1. We've already set up the initial structure:

- Installed Tailwind CSS and its dependencies
- Created the basic ShadCN UI structure
- Added a utilities file for class name merging
- Set up base components like Button and Sheet

### 2. Complete these remaining steps:

```bash
# Install additional Radix UI components as needed
bun add @radix-ui/react-label @radix-ui/react-select @radix-ui/react-checkbox
```

### 3. Add more ShadCN UI components as needed

Create the component files in `src/components/ui/`. You can find the code for each component in the [ShadCN UI documentation](https://ui.shadcn.com/docs/components).

## Component Migration Guide

Here's a mapping of MUI components to their ShadCN UI equivalents:

| MUI Component        | ShadCN UI Component                              |
|----------------------|--------------------------------------------------|
| Button               | Button                                           |
| TextField            | Input + Label                                    |
| Select               | Select, SelectTrigger, SelectContent, SelectItem |
| Checkbox             | Checkbox                                         |
| Radio                | RadioGroup, RadioGroupItem                       |
| Switch               | Switch                                           |
| Drawer               | Sheet                                            |
| Dialog               | Dialog, DialogContent, DialogHeader              |
| Accordion            | Accordion, AccordionItem, AccordionTrigger       |
| Tabs                 | Tabs, TabsList, TabsTrigger, TabsContent         |
| Menu                 | DropdownMenu                                     |
| Card                 | Card, CardHeader, CardContent, CardFooter        |
| Alert                | Alert, AlertTitle, AlertDescription              |
| Progress             | Progress                                         |
| Avatar               | Avatar, AvatarImage, AvatarFallback              |
| Typography           | Use Tailwind classes (text-xl, font-bold, etc.)  |
| ThemeProvider        | Not needed, use Tailwind's dark mode             |

## Theme Migration

### MUI Theme to Tailwind CSS

1. Replace your MUI theme configuration with Tailwind's theme extension:

MUI Theme (Before):
```javascript
createTheme({
  palette: {
    primary: {
      main: '#02FF95',
    },
    secondary: {
      main: '#121212',
    },
  },
});
```

Tailwind Config (After):
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // Other colors...
      },
    },
  },
};
```

2. Update CSS variables in `globals.css`:

```css
@layer base {
  :root {
    --primary: 156 100% 50%; /* #02FF95 in HSL */
    --secondary: 0 0% 7%; /* #121212 in HSL */
    /* Other variables... */
  }
}
```

## Migration Strategy

We recommend a gradual migration approach:

1. **Setup Phase (Complete)**:
   - Set up ShadCN UI infrastructure
   - Configure Tailwind CSS
   - Create base components

2. **Core Components Phase**:
   - Migrate layout components first (Sheet/Drawer, AppBar)
   - Update form components (Button, Input, Select)
   - Replace feedback components (Dialog, Alert)

3. **Feature-by-Feature Migration**:
   - Migrate components for one feature at a time
   - Test thoroughly after each feature migration
   - Gradually remove MUI dependencies

4. **Cleanup Phase**:
   - Remove all MUI dependencies
   - Refine Tailwind styles
   - Optimize bundle size

## Common Issues

1. **Styling Differences**:
   - MUI uses CSS-in-JS, while ShadCN UI uses Tailwind classes
   - You'll need to translate complex styling to Tailwind utility classes

2. **Component API Differences**:
   - ShadCN UI component APIs may differ from MUI
   - Pay attention to prop differences and component composition

3. **Icon Libraries**:
   - Replace MUI icons with Lucide React, which is recommended for ShadCN UI

4. **Theming**:
   - ShadCN UI uses CSS variables and Tailwind for theming instead of MUI's theme provider
   - Update your theme management accordingly

5. **Form Handling**:
   - ShadCN UI doesn't have a built-in form solution like Formik
   - Consider using React Hook Form with ShadCN UI components

## Example Component Migrations

Check out `src/examples/MUItoShadCN.tsx` for example migrations for common components.

For a complete Sidebar conversion, see the new `src/components/SidebarShadcn.tsx` file, which is a ShadCN UI version of the existing MUI Sidebar.
