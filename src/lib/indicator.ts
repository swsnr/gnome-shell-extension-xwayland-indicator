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

import GObject from "gi://GObject";
import Clutter from "gi://Clutter";
import St from "gi://St";
import Meta from "gi://Meta";

import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

export const XWaylandIndicator = GObject.registerClass(
  class XWaylandIndicator extends PanelMenu.Button {
    private readonly label: St.Label;

    constructor() {
      super(0, "XWayland Indicator", true);
      this.label = new St.Label();
      this.label.clutterText.yAlign = Clutter.ActorAlign.CENTER;
      this.setSensitive(false);
      this.add_child(this.label);
      this.set_label_actor(this.label);
      this.markWindow(null);
    }

    markX11Session(): void {
      this.visible = true;
      this.label.text = _("X11 session");
    }

    markWindow(window: Meta.Window | null) {
      const clientType = window?.get_client_type();
      if (clientType === Meta.WindowClientType.X11) {
        this.label.text = _("X");
        this.visible = true;
      } else {
        this.visible = false;
        this.label.text = "";
      }
    }
  },
);

export type XWaylandIndicator = InstanceType<typeof XWaylandIndicator>;
