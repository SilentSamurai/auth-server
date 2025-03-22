
# alias imgbdr := podman


# [working-directory: 'ims-frontend']
[group('k8s')]
[working-directory: 'ui']
build-image-ui:
    podman build -t auth-server-ui:latest .
    rm -f auth-server-ui.tar
    podman save -o auth-server-ui.tar auth-server-ui:latest
    sudo k3s ctr images rm localhost/auth-server-ui:latest
    sudo k3s ctr images import auth-server-ui.tar
    sudo k3s ctr images ls | grep auth-server


[working-directory: 'srv']
[group('k8s')]
build-image-backend:
    podman build -t auth-server:latest .
    rm -f auth-server.tar
    podman save -o auth-server.tar auth-server:latest
    sudo k3s ctr images rm localhost/auth-server:latest
    sudo k3s ctr images import auth-server.tar
    sudo k3s ctr images ls | grep auth-server

[group('k8s')]
[working-directory: 'helm']
deploy-auth-server:
    helm upgrade --install auth-server ./auth-server --namespace auth-server --create-namespace

[group('k8s')]
[working-directory: 'helm']
dry-run-auth-server:
    helm upgrade --install auth-server ./auth-server --namespace auth-server --create-namespace --dry-run --debug
