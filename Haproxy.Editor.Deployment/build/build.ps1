$Env:DOCKER_TAG = $(Get-Date -Format "yyyy-MM-dd")


Set-Location $PSScriptRoot
podman compose build

podman push "elyspio/haproxy-editor:$Env:DOCKER_TAG-api"
podman push "elyspio/haproxy-editor:$Env:DOCKER_TAG-front"


Set-Location "P:/own/common/keycloak/kubernetes/apps/haproxy-editor"
./update.ps1

Pop-Location
Pop-Location
