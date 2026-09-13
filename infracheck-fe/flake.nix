{
  description = "Frontend Setup environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_26
          ];

          # NixOS-specific: ensures pre-built binaries (like esbuild) find standard C++ libraries
          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
            pkgs.stdenv.cc.cc.lib
          ];

          shellHook = ''
            echo "=================================================="
            echo "  Nix Development For Frontend                    "
            echo "=================================================="
            echo "Node.js: $(node --version)"
            echo "npm:     $(npm --version)"
          '';
        };
      });
}
