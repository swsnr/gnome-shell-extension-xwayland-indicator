// Copyright Sebastian Wiesner <sebastian@swsnr.de>
//
// Licensed under the EUPL
//
// See https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12

import Gio from "gi://Gio";
import St from "gi://St";

/**
 * Load icons from a directory following the icon theme specificion.
 */
export class IconThemeLoader {
  /**
   * The theme to lookup our icons.
   */
  readonly #theme = St.IconTheme.new();

  /**
   * Create a new icon loader.
   *
   * @param iconDirectory The directory icons are contained in.
   */
  constructor(iconDirectory: Gio.File) {
    const iconPath = iconDirectory.get_path();
    if (iconPath === null) {
      throw new Error("Failed to get path of icon directory");
    }
    this.#theme.append_search_path(iconPath);
  }

  /**
   * Lookup an icon by name.
   *
   * @param name The name of the icon
   * @returns The icon
   */
  lookupIcon(name: string): Gio.Icon {
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
