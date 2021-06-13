{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = [ pkgs.nodejs-15_x ];
  shellHook = ''
    export PATH=$(pwd)/node_modules/.bin:$PATH
  '';
}

