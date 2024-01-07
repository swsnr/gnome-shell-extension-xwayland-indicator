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

import { DestructibleExtension } from "./lib/common/extension.js";
import { Destroyer, SignalConnectionTracker } from "./lib/common/lifecycle.js";

const displayLabel = (display: Meta.Display): string =>
  display.get_context().get_compositor_type() === Meta.CompositorType.X11
    ? "X11"
    : "wayland";

const windowLabel = (window: Meta.Window): string =>
  window.get_client_type() === Meta.WindowClientType.X11 ? "X11" : "wayland";

export default class XWaylandExtension extends DestructibleExtension {
  override initialize(destroyer: Destroyer): void {
    const signalTracker = destroyer.add(new SignalConnectionTracker());

    console.log("Display", displayLabel(global.display));
    signalTracker.track(
      global.display,
      global.display.connect("notify::focus-window", (display) => {
        // Explicitly mark `window` as nullable, because the inferred types aren't correct here.
        const window = display.get_focus_window() as Meta.Window | null;
        if (window !== null) {
          console.log(
            "Focused window changed:",
            windowLabel(display.get_focus_window()),
          );
        } else {
          console.log("Lost focus");
        }
      }),
    );
  }
}
