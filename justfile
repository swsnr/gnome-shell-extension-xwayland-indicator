default:
    just --list

test-all:
    npm ci
    npm audit
    npx tsc --project .
    npx eslint .
    npx prettier --check .

pack:
    rm -f xwayland-indicator@swsnr.de.shell-extension.zip xwayland-indicator@swsnr.de.shell-extension.zip.sig
    gnome-extensions pack --force --extra-source icons --extra-source LICENSE
    # Get my codeberg SSH key for signing the artifacts
    curl https://codeberg.org/swsnr.keys > key
    ssh-keygen -Y sign -f key -n file xwayland-indicator@swsnr.de.shell-extension.zip
    rm key

ensure-repo-clean:
    git update-index --really-refresh
    git diff-index --quiet HEAD

release VERSION: ensure-repo-clean
    sed -i 's/"version-name": .*,/"version-name": "{{VERSION}}",/' metadata.json
    git add metadata.json
    git commit -m 'Release {{VERSION}}'
    git tag -a -s 'v{{VERSION}}'
    just pack
    git push --follow-tags origin main
    echo "Upload zip to https://extensions.gnome.org"
    echo "Create a new codeberg release at https://codeberg.org/swsnr/gnome-shell-extension-xwayland-indicator/releases/new?tag=v{{VERSION}}"
