# WGSL Toy
**[https://wgsltoy.com](https://wgsltoy.com)**

## Developing
### Dependencies
All dependencies are managed with a Nix flake, [`flake.nix`](./flake.nix).
```bash
nix develop
```

### UI Development
The UI is developed with [Parcel](https://parceljs.org/) using Typescript and [Pug](https://pugjs.org).
```bash
# dev server
npm run start

# dev server, binding 0.0.0.0
npm run start:wsl2
```

### Infrastructure
The infrastructure is managed with Terraform and located in the [`terraform/`](./terraform/) directory.
```bash
cd ./terraform

terraform plan
terraform apply
```
