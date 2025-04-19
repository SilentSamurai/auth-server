# Define podman as the default container builder
# alias imgbdr := podman

# Build, save, and import the UI Docker image for local development/k3s
[group('k8s')]
[working-directory: 'ui']
build-image-ui:
    # Build the UI container image
    podman build -t auth-server-ui:latest .
    # Remove any existing tar file
    rm -f auth-server-ui.tar
    # Save the container image to a tar file
    podman save -o auth-server-ui.tar auth-server-ui:latest
    # Remove any existing image from k3s
    sudo k3s ctr images rm localhost/auth-server-ui:latest
    # Import the image into k3s
    sudo k3s ctr images import auth-server-ui.tar
    # List images to verify import
    sudo k3s ctr images ls | grep auth-server


# Build, save, and import the backend Docker image for local development/k3s
[working-directory: 'srv']
[group('k8s')]
build-image-backend:
    # Build the backend container image
    podman build -t auth-server:latest .
    # Remove any existing tar file
    rm -f auth-server.tar
    # Save the container image to a tar file
    podman save -o auth-server.tar auth-server:latest
    # Remove any existing image from k3s
    sudo k3s ctr images rm localhost/auth-server:latest
    # Import the image into k3s
    sudo k3s ctr images import auth-server.tar
    # List images to verify import
    sudo k3s ctr images ls | grep auth-server

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
