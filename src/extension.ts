// Copyright Sebastian Wiesner <sebastian@swsnr.de>
//
// Licensed under the EUPL
//
// See https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12

import Meta from "gi://Meta";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

import { Destroyer, DestructibleExtension } from "./lib/destructible.js";
import { IconThemeLoader } from "./lib/icons.js";
import { X11SessionIndicator } from "./lib/indicator/x11.js";
import { XWaylandWindowIndicator } from "./lib/indicator/wayland.js";

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

    const compositorType = global.display.get_context().get_compositor_type();
    if (compositorType === Meta.CompositorType.X11) {
      log.log("X11 session, not monitoring focused window");
      return destroyer.add(new X11SessionIndicator(iconLoader));
    } else {
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
  }

  override initialize(destroyer: Destroyer) {
    const indicator = this.#createIndicator(destroyer);
    Main.panel.addToStatusArea(this.metadata.uuid, indicator);
  }
}
