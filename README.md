# XWayland GNOME shell extension

[![Download on EGO](https://img.shields.io/badge/EGO-install-blue)](https://extensions.gnome.org/extension/6676/xwayland-indicator/)
![Codeberg Release](https://img.shields.io/gitea/v/release/swsnr/gnome-shell-extension-xwayland-indicator?gitea_url=https%3A%2F%2Fcodeberg.org)

Point out X11 windows in GNOME.

![](./screenshot.png)

This small GNOME extension shows the X11 logo in the panel if the current session uses X11 instead of wayland or if the currently focused window used xwayland.

## Install

Download the latest ZIP file from [releases](https://codeberg.org/swsnr/gnome-shell-extension-xwayland-indicator/releases),
and install with

```console
$ gnome-extensions install xwayland-indicator@swsnr.de.shell-extension.zip
```

Alternatively, install from [extensions.gnome.org](https://extensions.gnome.org/extension/6676/xwayland-indicator/), but note that releases on extensions.gnome.org may be delayed or outright rejected by its mandatory review process.
The author of this extension does not use extensions.gnome.org.

## License

Copyright Sebastian Wiesner <sebastian@swsnr.de>

Licensed under the EUPL, see <https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12>
