$Env:DOCKER_TAG = $(Get-Date -Format "yyyy-MM-dd")


Set-Location $PSScriptRoot
podman compose build

podman push "elyspio/haproxy-editor:$Env:DOCKER_TAG-api"
podman push "elyspio/haproxy-editor:$Env:DOCKER_TAG-front"

Pop-Location