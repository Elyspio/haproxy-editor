$Env:DOCKER_TAG = $(Get-Date -Format "yyyy-MM-dd")


Set-Location $PSScriptRoot
podman compose build

$apiImage = "elyspio/haproxy-editor:$Env:DOCKER_TAG-api";
$frontImage = "elyspio/haproxy-editor:$Env:DOCKER_TAG-front";
$frontLatest = "elyspio/haproxy-editor:latest-front";
$apiLatest = "elyspio/haproxy-editor:latest-api";

podman image tag  $apiImage $apiLatest
podman image tag  $frontImage $frontLatest

podman push $apiImage
podman push $frontImage
podman push $apiLatest
podman push $frontLatest


Set-Location "P:/own/common/keycloak/kubernetes/apps/haproxy-editor"
./update.ps1 $Env:DOCKER_TAG

Pop-Location
Pop-Location
