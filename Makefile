PREFIX = /usr/local
DESTDIR =
HOME-DESTDIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

UUID = xwayland-indicator@swsnr.de

DIST-EXTRA-SRC = LICENSE-GPL2 LICENSE-MPL2 icons
BLUEPRINTS = $(wildcard ui/*.blp)
UIDEFS = $(addsuffix .ui,$(basename $(BLUEPRINTS)))

.PHONY: dist
dist: compile
	mkdir -p ./dist/
	mkdir -p ./build/ui
	cp -t ./build/ui $(UIDEFS)
	pnpm dist:format
	gnome-extensions pack --force --out-dir dist build \
		--extra-source=../metadata.json \
		--extra-source=ui --extra-source lib \
		$(addprefix --extra-source=../,$(DIST-EXTRA-SRC)) \

# Make a reproducible dist package
.PHONY: dist-repro
dist-repro: dist
	strip-nondeterminism dist/$(UUID).shell-extension.zip

# Install to local home directory
.PHONY: install-home
install-home: dist
	gnome-extensions install -f dist/$(UUID).shell-extension.zip

.PHONY: uninstall-home
uninstall-home:
	rm -rf $(HOME-DESTDIR)

# Install as a system-wide installation, into a separate directory
# Intended for distribution packaging
.PHONY: install-package
install-package: dist
	install -d \
		$(DESTDIR)/$(PREFIX)/share/gnome-shell/extensions/$(UUID) \
		$(DESTDIR)/$(PREFIX)/share/glib-2.0/
	bsdtar -xf dist/$(UUID).shell-extension.zip \
		-C $(DESTDIR)/$(PREFIX)/share/gnome-shell/extensions/$(UUID) --no-same-owner

.PHONY: compile
compile: $(UIDEFS)
	pnpm compile

.PHONY: clean
clean:
	rm -rf ./dist/ ./build/

.PHONY: format
format:
	pnpm format --write

.PHONY: lint
lint:
	pnpm lint

.PHONY: check-types
check-types:
	pnpm check:types

.PHONY: check
check: lint check-types
	pnpm format --check

.PHONY: fix
fix: format
	pnpm lint --fix

$(UIDEFS): %.ui: %.blp
	blueprint-compiler compile --output $@ $<
