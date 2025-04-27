# Define podman as the default container builder
# alias imgbdr := podman

# Build, save, and import the UI Docker image for local development/k3s
[group('k8s')]
download-and-import-image:
    #!/usr/bin/env bash
    set -e
    # Utility: Check if a command exists
    command_exists() {
        command -v "$1" >/dev/null 2>&1
    }

    echo "🧹 Removing old tar files..."
    rm -f *.tar || true
    # Validate required commands
    for cmd in curl jq xargs sed find; do
        if ! command_exists "$cmd"; then
            echo "❌ Missing required command: $cmd"
            exit 1
        fi
    done
    # Use 'sudo' only if not already root
    SUDO=''
    if [ "$(id -u)" -ne 0 ]; then
      SUDO='sudo'
    fi

    echo "📦 Downloading latest release tarball from GitHub..."
    curl -s https://api.github.com/repos/SilentSamurai/auth-server/releases/latest \
    | jq -r '.assets[].browser_download_url' \
    | xargs -L1 curl -O -L -#

    echo "🧼 Removing previous auth-server images from k3s..."
    $SUDO k3s ctr images ls | grep auth-server | awk '{print $1}' | xargs -r -L1 $SUDO k3s ctr images rm || true

    echo "📥 Importing downloaded tarballs into k3s..."
    find . -name '*.tar' | xargs -r -L1 $SUDO k3s ctr images import

    echo "✅ Current k3s auth-server images:"
    $SUDO k3s ctr images ls | grep auth-server || echo "No images found"


# Deploy the auth-server using Helm to the Kubernetes cluster
[group('k8s')]
[working-directory: 'helm']
deploy-auth-server:
    # Install or upgrade the auth-server Helm chart
    helm upgrade --install auth-server ./auth-server --namespace auth-server --create-namespace

# Perform a Helm dry-run deployment with debug for the auth-server
[group('k8s')]
[working-directory: 'helm']
dry-run-auth-server:
    # Simulate deployment without making actual changes
    helm upgrade --install auth-server ./auth-server --namespace auth-server --create-namespace --dry-run --debug
