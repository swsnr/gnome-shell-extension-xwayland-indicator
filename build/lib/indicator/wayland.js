// Copyright Sebastian Wiesner <sebastian@swsnr.de>
//
// Licensed under the EUPL
//
// See https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12
import GObject from "gi://GObject";
import St from "gi://St";
import Meta from "gi://Meta";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
export const XWaylandWindowIndicator = GObject.registerClass(
/**
 * An indicator for XWayland windows in wayland sessions.
 */
class XWaylandWindowIndicator extends PanelMenu.Button {
    /**
     * Create a new indicator for XWayland windows.
     *
     * @param iconLoader Load icons.
     */
    constructor(iconLoader) {
        super(0, "XWayland Window", true);
        this.add_child(new St.Icon({
            styleClass: "system-status-icon",
            gicon: iconLoader.lookupIcon("window-x11-symbolic"),
        }));
        this.setSensitive(false);
        this.markWindow(null);
    }
    /**
     * Mark the given `window` on this indicator.
     *
     * @param window The window to update the indicator for.
     */
    markWindow(window) {
        const clientType = window?.get_client_type();
        this.visible = clientType === Meta.WindowClientType.X11;
    }
});
