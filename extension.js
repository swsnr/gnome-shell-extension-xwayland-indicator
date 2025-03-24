// Copyright Sebastian Wiesner <sebastian@swsnr.de>
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0.If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Alternatively, the contents of this file may be used under the terms
// of the GNU General Public License Version 2 or later, as described below:
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// @ts-check

/// <reference path="gnome-shell.d.ts" />

import GObject from "gi://GObject";
import Gio from "gi://Gio";
import St from "gi://St";
import Meta from "gi://Meta";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

/**
 * @import {ConsoleLike} from "resource:///org/gnome/shell/extensions/extension.js"
 */

/**
 * Load icons from a directory following the icon theme specificion.
 */
class IconThemeLoader {
  /**
   * The theme to lookup our icons.
   *
   * @type {St.IconTheme}
   */
  #theme = St.IconTheme.new();

  /**
   * Create a new icon loader.
   *
   * @param {Gio.File} iconDirectory The directory icons are contained in.
   */
  constructor(iconDirectory) {
    const iconPath = iconDirectory.get_path();
    if (iconPath === null) {
      throw new Error("Failed to get path of icon directory");
    }
    this.#theme.append_search_path(iconPath);
  }

  /**
   * Lookup an icon by name.
   *
   * @param {string} name The name of the icon
   * @returns {Gio.Icon} The icon
   */
  lookupIcon(name) {
    // We only include SVG icons currently, so we can just specify any size and
    // ignore the scale.  We force SVG to be on the safe side.
    const icon = this.#theme.lookup_icon(
      name,
      16,
      St.IconLookupFlags.FORCE_SVG,
    );
    if (icon === null) {
      throw new Error(`Icon ${name} not found`);
    }
    const iconFilename = icon.get_filename();
    if (iconFilename === null) {
      throw new Error(`Icon ${name} had no file`);
    }
    return Gio.FileIcon.new(Gio.File.new_for_path(iconFilename));
  }
}

/**
 * A destroyer of things.
 *
 * Tracks destructible objects and destroys them all when it itself is destroyed.
 *
 * @typedef {{destroy: () => void}} Destructible
 */
class Destroyer {
  /**
   * @type {ConsoleLike}
   */
  #logger;

  /**
   * Create a new destroyer.
   *
   * @param {ConsoleLike} logger
   */
  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * Registered destructibles.
   *
   * @type Destructible[]
   */
  #destructibles = [];

  /**
   * Track a destructible object.
   *
   * The object is destroyed when this destroyer gets destroyed.
   *
   * @template {Destructible} T Type of object to destroy
   * @param {T} destructible The object to track
   * @returns {T} `destructible`
   */
  add(destructible) {
    this.#destructibles.push(destructible);
    return destructible;
  }

  /**
   * Destroy all tracked destructible objects.
   */
  destroy() {
    let destructible = undefined;
    while ((destructible = this.#destructibles.pop())) {
      try {
        destructible.destroy();
      } catch (error) {
        this.#logger.error("Failed to destroy object", destructible, error);
      }
    }
  }
}

const X11SessionIndicator = GObject.registerClass(
  /**
   * An indicator for X11 sessions.
   *
   * @implements Destructible
   */
  class X11SessionIndicator extends PanelMenu.Button {
    /**
     * Create a new indicator for an X11 session.
     * s
     * @param {IconThemeLoader} iconLoader Load icons.
     */
    constructor(iconLoader) {
      super(0, "X11 session", true);

      this.add_child(
        new St.Icon({
          styleClass: "system-status-icon",
          gicon: iconLoader.lookupIcon("x11-symbolic"),
        }),
      );

      this.setSensitive(false);
    }
  },
);

const XWaylandWindowIndicator = GObject.registerClass(
  /**
   * An indicator for XWayland windows in wayland sessions.
   *
   * @implements Destructible
   */
  class XWaylandWindowIndicator extends PanelMenu.Button {
    /**
     * Create a new indicator for XWayland windows.
     * s
     * @param {IconThemeLoader} iconLoader Load icons.
     */
    constructor(iconLoader) {
      super(0, "XWayland Window", true);

      this.add_child(
        new St.Icon({
          styleClass: "system-status-icon",
          gicon: iconLoader.lookupIcon("window-x11-symbolic"),
        }),
      );

      this.setSensitive(false);
      this.markWindow(null);
    }

    /**
     * Mark the given `window` on this indicator.
     *
     * @param {Meta.Window | null} window The window to update the indicator for.
     */
    markWindow(window) {
      const clientType = window?.get_client_type();
      this.visible = clientType === Meta.WindowClientType.X11;
    }
  },
);

/**
 * XWayland indicator extension.
 *
 * In an X11 session show a static indicator with the X11 logo.  In a wayland
 * session show a X11 window icon whenever the currently focused window uses
 * XWayland.
 */
export default class XWaylandExtension extends Extension {
  /**
   * Destructible for the enabled extension, or null if the extension is not enabled.
   *
   * @type {Destructible | null}
   */
  #enabledExtension = null;

  /**
   * The version of this extension, as extracted from metadata.
   *
   * @type {string}
   */
  get version() {
    return this.metadata["version-name"] ?? "n/a";
  }

  /**
   * Create the indicator for this extension.
   *
   * @param {Destroyer} destroyer To register cleanup actions
   * @returns {PanelMenu.Button} The indicator
   */
  #createIndicator(destroyer) {
    const log = this.getLogger();
    const iconLoader = new IconThemeLoader(
      this.metadata.dir.get_child("icons"),
    );

    const compositorType = global.display.get_context().get_compositor_type();
    if (compositorType === Meta.CompositorType.X11) {
      log.log("X11 session, not monitoring focused window");
      return destroyer.add(new X11SessionIndicator(iconLoader));
    } else {
      const indicator = destroyer.add(new XWaylandWindowIndicator(iconLoader));
      log.log("Wayland session, monitoring focused window");

      const signalId = global.display.connect("focus-window", (_, window) => {
        indicator.markWindow(window);
      });
      destroyer.add({
        destroy: () => {
          global.display.disconnect(signalId);
        },
      });

      indicator.markWindow(global.display.focusWindow);
      return indicator;
    }
  }

  /**
   * Initialize this extension.
   *
   * Create the indicator and add it to the status area.
   *
   * @param {Destroyer} destroyer Tor egister cleanup actions on.
   */
  #initialize(destroyer) {
    const indicator = this.#createIndicator(destroyer);
    Main.panel.addToStatusArea(this.metadata.uuid, indicator);
  }

  /**
   * Enable this extension.
   *
   * If not already enabled, call `initialize` and keep track its allocated resources.
   *
   * @override
   */
  enable() {
    const log = this.getLogger();
    if (!this.#enabledExtension) {
      log.log(`Enabling extension ${this.metadata.uuid} ${this.version}`);
      const destroyer = new Destroyer(log);
      try {
        this.#initialize(destroyer);
      } catch (error) {
        destroyer.destroy();
        throw error;
      }

      this.#enabledExtension = destroyer;
      log.log(
        `Extension ${this.metadata.uuid} ${this.version} successfully enabled`,
      );
    }
  }

  /**
   * Disable this extension.
   *
   * If existing, destroy the allocated resources of `initialize`.
   *
   * @override
   */
  disable() {
    this.getLogger().log(
      `Disabling extension ${this.metadata.uuid} ${this.version}`,
    );
    this.#enabledExtension?.destroy();
    this.#enabledExtension = null;
  }
}
