// Copyright Sebastian Wiesner <sebastian@swsnr.de>
//
// Licensed under the EUPL
//
// See https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12
import GObject from "gi://GObject";
import St from "gi://St";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
export const X11SessionIndicator = GObject.registerClass(
/**
 * An indicator for X11 sessions.
 */
class X11SessionIndicator extends PanelMenu.Button {
    /**
     * Create a new indicator for an X11 session.
     * s
     * @param iconLoader Load icons.
     */
    constructor(iconLoader) {
        super(0, "X11 session", true);
        this.add_child(new St.Icon({
            styleClass: "system-status-icon",
            gicon: iconLoader.lookupIcon("x11-symbolic"),
        }));
        this.setSensitive(false);
    }
});
