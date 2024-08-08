#! /usr/bin/env bash

set -euxo pipefail

ci_tool_cli=${1:-ci-tool}
echo "Using: ${ci_tool_cli}"

export AWS_ACCESS_KEY_ID=$(bws secret get e0838fef-4766-4c5d-b23f-b15300150c4b | jq -r .value)
export AWS_SECRET_ACCESS_KEY=$(bws secret get 5afad0ea-37f1-4360-a0ca-b1530014d9c5 | jq -r .value)

nix build .#staticAssets

${ci_tool_cli} aws deploy-static-assets result/ wgsltoy-com-site
${ci_tool_cli} aws invalidate-static-assets E1XLEBJEC3PWRA
