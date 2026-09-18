{
  description = "InfraCheck Backend — Laravel";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        php = pkgs.php83.buildEnv {
          extensions = ({ enabled, all }: enabled ++ (with all; [
            pdo
            pdo_pgsql
            mbstring
            xml
            curl
            zip
            gd
            tokenizer
            fileinfo
            openssl
          ]));
          extraConfig = ''
            memory_limit = 256M
          '';
        };

      in {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            php
            pkgs.phpPackages.composer
            pkgs.postgresql_16
            pkgs.nodejs_26
            pkgs.railway
          ];

          shellHook = ''
  echo "Infracheck Backend Dev Shell"
  echo "PHP: $(php --version | head -1)"
  echo "Composer: $(composer --version)"

  # PostgreSQL setup
  export PGDATA="$PWD/.postgres/data"
  export PGHOST="$PWD/.postgres"
  export PGPORT=5432

  if [ ! -d "$PGDATA" ]; then
    echo "Initializing PostgreSQL cluster..."
    initdb -D "$PGDATA" --no-locale --encoding=UTF8
    echo "unix_socket_directories = '$PGHOST'" >> "$PGDATA/postgresql.conf"
  fi

  if ! pg_ctl status -D "$PGDATA" > /dev/null 2>&1; then
    echo "Starting PostgreSQL..."
    pg_ctl start -D "$PGDATA" -l "$PGHOST/postgres.log" -o "-k $PGHOST"
    
    # Buat database kalau belum ada
    sleep 1
    createdb infracheck 2>/dev/null || true
  fi

  # Stop otomatis waktu keluar shell
  trap "pg_ctl stop -D '$PGDATA'" EXIT
'';
        };
      }
    );
}
