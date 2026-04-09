// Copyright Sebastian Wiesner <sebastian@swsnr.de>
//
// Licensed under the EUPL
//
// See https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12

import GObject from "gi://GObject";
import St from "gi://St";
import Meta from "gi://Meta";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

import {
  Destructible,
  Destroyer,
  DestructibleExtension,
} from "./lib/destructible.js";
import { IconThemeLoader } from "./lib/icons.js";

const XWaylandWindowIndicator = GObject.registerClass(
  /**
   * An indicator for XWayland windows in wayland sessions.
   */
  class XWaylandWindowIndicator
    extends PanelMenu.Button
    implements Destructible
  {
    /**
     * Create a new indicator for XWayland windows.
     *
     * @param iconLoader Load icons.
     */
    constructor(iconLoader: IconThemeLoader) {
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
     * @param window The window to update the indicator for.
     */
    markWindow(window: Meta.Window | null) {
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
export default class XWaylandExtension extends DestructibleExtension {
  /**
   * Create the indicator for this extension.
   *
   * @param destroyer To register cleanup actions
   * @returns The indicator
   */
  #createIndicator(destroyer: Destroyer): PanelMenu.Button {
    const log = this.getLogger();
    const iconLoader = new IconThemeLoader(this.dir.get_child("icons"));

    const indicator = destroyer.add(new XWaylandWindowIndicator(iconLoader));
    log.log("Wayland session, monitoring focused window");

    destroyer.addSignal(
      global.display,
      global.display.connect("focus-window", (_, window) => {
        indicator.markWindow(window);
      }),
    );

    indicator.markWindow(global.display.focusWindow);
    return indicator;
  }

  override initialize(destroyer: Destroyer) {
    const indicator = this.#createIndicator(destroyer);
    Main.panel.addToStatusArea(this.metadata.uuid, indicator);
  }
}
