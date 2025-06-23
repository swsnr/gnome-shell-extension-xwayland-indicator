// Copyright Sebastian Wiesner <sebastian@swsnr.de>
//
// Licensed under the EUPL
//
// See https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12

import GObject from "gi://GObject";
import {
  Extension,
  type ConsoleLike,
} from "resource:///org/gnome/shell/extensions/extension.js";

/**
 * A destructible thing.
 */
export interface Destructible {
  destroy(): void;
}

/**
 * A destroyer of things.
 *
 * Tracks destructible objects and destroys them all when it itself is destroyed.
 */
export class Destroyer {
  readonly #logger: ConsoleLike;

  /**
   * Create a new destroyer.
   */
  constructor(logger: ConsoleLike) {
    this.#logger = logger;
  }

  /**
   * Registered destructibles.
   */
  #destructibles: Destructible[] = [];

  /**
   * Track a destructible object.
   *
   * The object is destroyed when this destroyer gets destroyed.
   *
   * @param destructible The object to track
   * @returns `destructible`
   */
  add<T extends Destructible>(destructible: T): T {
    this.#destructibles.push(destructible);
    return destructible;
  }

  /**
   * Track a property binding for destruction.
   *
   * Unbind the `binding` when this destroyer gets destroyed.
   *
   * @param binding The binding to track
   * @returns `binding`
   */
  addBinding(binding: GObject.Binding): GObject.Binding {
    this.add({
      destroy() {
        binding.unbind();
      },
    });
    return binding;
  }

  /**
   * Track a connected signal for disconnection upon destruction.
   *
   * Disconnect the signal handler with the given `handlerId` from the given
   * object when this destroyer gets destroyed.
   *
   * @param obj The object the signal was connected on and needs to be disconnected on
   * @param handlerId The ID of the connected signal handler, as returned by `connect()`
   */
  addSignal(obj: GObject.Object, handlerId: number) {
    this.add({
      destroy() {
        obj.disconnect(handlerId);
      },
    });
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

/**
 * An extension which destroys itself when disabled.
 */
export abstract class DestructibleExtension extends Extension {
  /**
   * Destructible for the enabled extension, or null if the extension is not enabled.
   */
  #enabledExtension: Destructible | null = null;

  /**
   * The version of this extension, as extracted from metadata.
   */
  get version(): string {
    return this.metadata["version-name"] ?? "n/a";
  }

  /**
   * Initialize this extension.
   *
   * @param destroyer To register cleanup actions on.
   */
  protected abstract initialize(destroyer: Destroyer): void;

  /**
   * Enable this extension.
   *
   * If not already enabled, call `initialize` and keep track its allocated resources.
   */
  override enable() {
    const log = this.getLogger();
    if (!this.#enabledExtension) {
      log.log(`Enabling extension ${this.metadata.uuid} ${this.version}`);
      const destroyer = new Destroyer(log);
      try {
        this.initialize(destroyer);
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
   */
  override disable() {
    this.getLogger().log(
      `Disabling extension ${this.metadata.uuid} ${this.version}`,
    );
    this.#enabledExtension?.destroy();
    this.#enabledExtension = null;
  }
}
