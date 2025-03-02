#!/bin/bash

# Debug script for BuildItRecords application
# This script helps troubleshoot common issues with the MUI to ShadCN migration

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}BuildItRecords Debug Tool${NC}"
echo "==============================="
echo

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${RED}Error: bun is not installed${NC}"
    echo "Please install bun by following the instructions at https://bun.sh/"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Warning: node_modules not found${NC}"
    echo "Running bun install..."
    bun install
fi

# Check if temp_modules directory exists
if [ ! -d "temp_modules" ]; then
    echo -e "${YELLOW}Warning: temp_modules not found${NC}"
    echo "Creating temp_modules..."
    mkdir -p temp_modules
fi

# Check for polyfill files
echo -e "${BLUE}Checking polyfill files:${NC}"
if [ -f "src/process-polyfill.ts" ]; then
    echo -e "  - ${GREEN}✓ process-polyfill.ts found${NC}"
else
    echo -e "  - ${RED}✗ process-polyfill.ts missing${NC}"
fi

if [ -f "src/mui-polyfill.ts" ]; then
    echo -e "  - ${GREEN}✓ mui-polyfill.ts found${NC}"
else
    echo -e "  - ${RED}✗ mui-polyfill.ts missing${NC}"
fi

if [ -f "src/window-polyfill.ts" ]; then
    echo -e "  - ${GREEN}✓ window-polyfill.ts found${NC}"
else
    echo -e "  - ${RED}✗ window-polyfill.ts missing${NC}"
fi

# Check for placeholder files
echo -e "\n${BLUE}Checking placeholder files:${NC}"
if [ -f "src/components/ui/mui-placeholder.tsx" ]; then
    echo -e "  - ${GREEN}✓ mui-placeholder.tsx found${NC}"
else
    echo -e "  - ${RED}✗ mui-placeholder.tsx missing${NC}"
fi

if [ -f "src/components/ui/icons/index.tsx" ]; then
    echo -e "  - ${GREEN}✓ icons/index.tsx found${NC}"
else
    echo -e "  - ${RED}✗ icons/index.tsx missing${NC}"
fi

# Clean build
echo -e "\n${BLUE}Cleaning previous build...${NC}"
rm -rf dist

# Run the build with NODE_PATH for better module resolution
echo -e "\n${BLUE}Building application...${NC}"
NODE_PATH=./temp_modules bun run build

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Build successful!${NC}"
    
    # Start servers
    echo -e "\n${BLUE}Starting servers...${NC}"
    echo "Frontend will be available at: http://localhost:3000"
    echo "Backend will be available at: http://localhost:3001"
    echo -e "${YELLOW}Press Ctrl+C to stop the servers${NC}"
    
    # Run servers in background
    bun run frontend & FRONTEND_PID=$!
    bun run backend & BACKEND_PID=$!
    
    # Wait for user to press Ctrl+C
    trap "kill $FRONTEND_PID $BACKEND_PID; echo -e '\n${GREEN}Servers stopped${NC}'; exit 0" INT
    wait
else
    echo -e "\n${RED}Build failed!${NC}"
    echo "Check the error messages above to fix the build issues."
    exit 1
fi
