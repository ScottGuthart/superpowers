#!/usr/bin/env bash
# Setup script for pi coding agent superpowers extension
# Installs superpowers extension and creates directory structure
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Get the repository root (three levels up from .pi/scripts/)
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Determine install location
PI_CONFIG_DIR="${PI_CONFIG_DIR:-$HOME/.pi/agent}"
INSTALL_DIR="$PI_CONFIG_DIR/superpowers"
EXTENSIONS_DIR="$PI_CONFIG_DIR/extensions"
SKILLS_DIR="$PI_CONFIG_DIR/skills"

info "Installing superpowers for pi coding agent"
info "Repository: $REPO_ROOT"
info "Install directory: $INSTALL_DIR"

# Check if running from the repo or need to clone
if [ "$REPO_ROOT" = "$INSTALL_DIR" ]; then
    info "Already in install directory, skipping clone"
else
    # Create install directory
    mkdir -p "$PI_CONFIG_DIR"

    if [ -d "$INSTALL_DIR" ]; then
        warn "Install directory already exists: $INSTALL_DIR"
        read -p "Remove and reinstall? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            info "Removing existing installation"
            rm -rf "$INSTALL_DIR"
        else
            error "Installation cancelled"
        fi
    fi

    # Clone repository
    info "Cloning superpowers repository to $INSTALL_DIR"
    git clone https://github.com/obra/superpowers.git "$INSTALL_DIR" || error "Failed to clone repository"
fi

# Create extensions directory
mkdir -p "$EXTENSIONS_DIR"

# Create symlink for extension
EXTENSION_SYMLINK="$EXTENSIONS_DIR/superpowers.ts"
if [ -L "$EXTENSION_SYMLINK" ]; then
    info "Extension symlink already exists, removing"
    rm "$EXTENSION_SYMLINK"
fi

info "Creating extension symlink"
ln -sf "$INSTALL_DIR/.pi/extensions/superpowers.ts" "$EXTENSION_SYMLINK" || error "Failed to create extension symlink"

# Create personal skills directory
mkdir -p "$SKILLS_DIR"

# Verify installation
info "Verifying installation..."

if [ ! -f "$INSTALL_DIR/.pi/extensions/superpowers.ts" ]; then
    error "Extension file not found: $INSTALL_DIR/.pi/extensions/superpowers.ts"
fi

if [ ! -L "$EXTENSION_SYMLINK" ]; then
    error "Extension symlink not created: $EXTENSION_SYMLINK"
fi

if [ ! -d "$INSTALL_DIR/skills" ]; then
    error "Skills directory not found: $INSTALL_DIR/skills"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    warn "Node.js not found. pi requires Node.js for TypeScript extension support."
    warn "Install Node.js from https://nodejs.org/"
fi

# Success message
info ""
info "✓ Superpowers installation complete!"
info ""
info "Installation details:"
info "  Extension: $EXTENSION_SYMLINK"
info "  Skills: $INSTALL_DIR/skills"
info "  Personal skills: $SKILLS_DIR"
info ""
info "Next steps:"
info "  1. Restart pi coding agent"
info "  2. Verify by asking: 'do you have superpowers?'"
info "  3. List skills with: /find_skills"
info "  4. Load a skill with: use_skill tool"
info ""
info "For more information, see: $INSTALL_DIR/.pi/INSTALL.md"
