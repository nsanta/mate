 #!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Function to print steps
print_step() {
    echo "=================================================="
    echo "$1"
    echo "=================================================="
}

# 1. Run Tests
print_step "Running Tests..."
npm test

# 2. Build the project
print_step "Building Project..."
npm run build

# 3. Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "Error: You have uncommitted changes. Please commit or stash them before publishing."
    exit 1
fi

# 4. Ask for version bump type
echo "Select version bump type:"
select bump in "patch" "minor" "major"; do
    case $bump in
        patch|minor|major ) break;;
        * ) echo "Please select 1, 2, or 3";;
    esac
done

# 5. Bump version
print_step "Bumping Version ($bump)..."
npm version $bump

# 6. Publish to NPM
print_step "Publishing to NPM..."
npm publish

# 7. Push to Git (including tags)
print_step "Pushing to Git..."
git push origin main --tags

echo "Successfully published!"
