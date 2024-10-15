{
  description = "Rust + Nix starter";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    htpp = {
      url = "github:sdedovic/htpp";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    flake-utils,
    nixpkgs,
    htpp,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
        nodejs = pkgs.nodejs_20;
        htppPackage = htpp.packages.${system}.htpp;
        base = pkgs.buildNpmPackage {
          pname = "dedovic.com";
          version = "1.0.0";
          src = ./.;

          nativeBuildInputs = [pkgs.pkg-config pkgs.python310 htppPackage];
          npmInstallFlags = ["--no-dev"];
          buildInputs = [pkgs.vips];

          inherit nodejs;
          npmDepsHash = "sha256-4vOjUTgiSh3O6LGz87qS7vHaVczWbiGMe+fvTsw2SjY=";

          buildPhase = ''
            npx parcel build --dist-dir dist src/index.htpp
          '';

          installPhase = ''
            mkdir $out
            cp -r dist/static/* $out
          '';
        };
      in {
        formatter = pkgs.alejandra;
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.terraform

            htppPackage

            nodejs
            nodejs.pkgs.typescript-language-server
          ];
        };

        packages = {
          staticAssets = base.overrideAttrs (final: prev: {
            installPhase = ''
              mkdir $out
              cp -r dist/static/* $out
            '';
          });

          templates = base.overrideAttrs (final: prev: {
            installPhase = ''
              mkdir $out
              cp -r dist/template/* $out
            '';
          });
        };
      }
    );
}
