#!/bin/bash

#You need to have docker installed and running to use this script
# https://www.docker.com/


# Check current git branch
current_branch=$(git rev-parse --abbrev-ref HEAD)

if [ "$current_branch" != "staging" ]; then
    echo "It is best to do this in staging. Would you like to move to staging? (Y/N)"
    read -r response
    if [ "$response" = "Y" ] || [ "$response" = "y" ]; then
        git checkout staging
    fi
fi

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "Homebrew is already installed."
fi

# Check if NPM is installed
if ! command -v npm &> /dev/null; then
    echo "NPM not found. Installing NPM..."
    brew install npm
else
    echo "NPM is already installed."
fi

# Check if PNPM is installed
if ! command -v pnpm &> /dev/null; then
    echo "PNPM not found. Installing PNPM..."
    brew install pnpm
else
    echo "PNPM is already installed."
fi

if ! command -v bun &> /dev/null; then
    echo "Bun not found. Installing Bun..."
    brew install bun
else
    echo "Bun is already installed."
fi

# Run pnpm install
echo "Running pnpm install..."
pnpm i

# Run turbo build
echo "Running turbo build..."
if ! pnpm exec turbo build; then
    echo "Turbo build failed. Please fix the issues and rerun this script."

    echo "If you are only running braintrust evals, you only need to build the AI package, would you like to do that? (Y/N)"
    read -r response
    if [ "$response" = "Y" ] || [ "$response" = "y" ]; then
        if ! pnpm exec turbo build --filter @buster/ai; then
            echo "Turbo build failed. Please fix the issues and rerun this script."
            exit 1
        fi
    else
        exit 1
    fi
fi

#Docker setup
echo "Setting up docker..."
open -a Docker

echo "Initializing database..."
pnpm exec turbo run db:init


echo "Setup complete, you can now run evals"