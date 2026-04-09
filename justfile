tsc := 'npx tsc'

uuid := 'xwayland-indicator@swsnr.de'
artifact := uuid + '.shell-extension.zip'

default:
    just --list

lint:
    npx eslint .
    npx prettier --check .
    npm audit

typecheck:
    npx tsc --project .

test-all: typecheck lint

clean:
    rm -rf build '{{artifact}}' '{{artifact}}.sig'

build:
    {{tsc}} --project ./tsconfig.pack.json
    cp -t build metadata.json

pack: clean build
    gnome-extensions pack --force \
        --extra-source ../icons --extra-source ../LICENSE --extra-source lib \
        build

sign: pack
    @# Get my codeberg SSH key for signing the artifacts
    curl https://codeberg.org/swsnr.keys > key
    ssh-keygen -Y sign -f key -n file '{{artifact}}'
    @rm -f key

_ensure-repo-clean:
    git update-index --really-refresh
    git diff-index --quiet HEAD

release VERSION: _ensure-repo-clean
    sed -i 's/"version-name": .*,/"version-name": "{{VERSION}}",/' metadata.json
    git add metadata.json
    git commit -m 'Release {{VERSION}}'
    git tag -a -s 'v{{VERSION}}'
    just sign
    git push --follow-tags origin main
    @echo "Upload zip to https://extensions.gnome.org"
    @echo "Create a new codeberg release at https://codeberg.org/swsnr/gnome-shell-extension-xwayland-indicator/releases/new?tag=v{{VERSION}}"
