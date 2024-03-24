PREFIX = /usr/local
DESTDIR =
HOME-DESTDIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

UUID = xwayland-indicator@swsnr.de

DIST-EXTRA-SRC = LICENSE-GPL2 LICENSE-MPL2
BLUEPRINTS = $(wildcard ui/*.blp)
UIDEFS = $(addsuffix .ui,$(basename $(BLUEPRINTS)))

.PHONY: dist
dist: compile
	mkdir -p ./dist/
	mkdir -p ./build/ui
	cp -t ./build/ui $(UIDEFS)
	yarn dist:format
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
	mv -T --no-clobber \
		$(DESTDIR)/$(PREFIX)/share/gnome-shell/extensions/$(UUID)/locale \
		$(DESTDIR)/$(PREFIX)/share/locale

.PHONY: compile
compile: $(UIDEFS)
	yarn compile

.PHONY: clean
clean:
	rm -rf ./dist/ ./build/

.PHONY: format
format:
	yarn format --write

.PHONY: lint
lint:
	yarn lint

.PHONY: check-types
check-types:
	yarn check:types

.PHONY: check
check: lint check-types
	yarn format --check

.PHONY: fix
fix: format
	yarn lint --fix

$(UIDEFS): %.ui: %.blp
	blueprint-compiler compile --output $@ $<
