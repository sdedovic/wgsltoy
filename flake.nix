{
  description = "Rust + Nix starter";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = {
    self,
    flake-utils,
    nixpkgs,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
        nodejs = pkgs.nodejs_20;
      in {
        formatter = pkgs.alejandra;
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.bws
            pkgs.terraform

            nodejs
            nodejs.pkgs.typescript-language-server
          ];
        };
        packages.staticAssets = pkgs.buildNpmPackage {
          pname = "dedovic.com";
          version = "1.0.0";
          src = ./.;

          nativeBuildInputs = [pkgs.pkg-config pkgs.python310];
          npmInstallFlags = ["--no-dev"];
          buildInputs = [pkgs.vips];

          inherit nodejs;
          npmDepsHash = "sha256-hDPJtyCeiM3vMEgZg3C1jfEcJuHF4u2KltOci0ck7S4=";

          buildPhase = ''
            npx parcel build --dist-dir dist src/index.pug
          '';

          installPhase = ''
            mkdir $out
            cp -r dist/* $out
          '';
        };
      }
    );
}
