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

import Meta from "gi://Meta";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

import { DestructibleExtension } from "./lib/common/extension.js";
import { Destroyer, SignalConnectionTracker } from "./lib/common/lifecycle.js";
import {
  X11SessionIndicator,
  XWaylandWindowIndicator,
} from "./lib/indicator.js";
import { IconThemeLoader } from "./lib/common/ui/icons.js";

export default class XWaylandExtension extends DestructibleExtension {
  private createIndicator(destroyer: Destroyer): PanelMenu.Button {
    const iconLoader = new IconThemeLoader(
      this.metadata.dir.get_child("icons"),
    );

    const compositorType = global.display.get_context().get_compositor_type();
    if (compositorType === Meta.CompositorType.X11) {
      console.log("X11 session, not monitoring focused window");
      return new X11SessionIndicator(iconLoader);
    } else {
      const signalTracker = destroyer.add(new SignalConnectionTracker());

      const indicator = destroyer.add(new XWaylandWindowIndicator(iconLoader));
      console.log("Wayland session, monitoring focused window");

      signalTracker.track(
        global.display,
        global.display.connect(
          "notify::focus-window",
          (_, window: Meta.Window) => {
            indicator.markWindow(window);
          },
        ),
      );
      indicator.markWindow(global.display.focusWindow);
      return indicator;
    }
  }

  override initialize(destroyer: Destroyer): void {
    const indicator = this.createIndicator(destroyer);
    Main.panel.addToStatusArea(this.metadata.uuid, indicator);
  }
}
