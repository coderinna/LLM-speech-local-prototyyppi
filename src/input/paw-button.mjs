
import { EventEmitter } from "node:events";
import readline from "node:readline";

export class PawButton extends EventEmitter {
  #pressed = false;
  #running = false;
  #stdinWasRaw = false;
  #onKeypress = null;

  async start() {
    if (this.#running) {
      return;
    }

    this.#running = true;

    if (process.stdin.isTTY) {
      this.#stdinWasRaw = process.stdin.isRaw;

      readline.emitKeypressEvents(process.stdin);

      process.stdin.setRawMode(true);
      process.stdin.resume();

      this.#onKeypress = (_str, key) => {
        if (!this.#running) {
          return;
        }

        // Enter = aloita / lopeta tallennus
        if (key?.name === "return") {
          if (!this.#pressed) {
            this.press();
          } else {
            this.release();
          }

          return;
        }

        // Escape tai Ctrl+C = lopeta ohjelma
        if (
          key?.name === "escape" ||
          (key?.ctrl && key?.name === "c")
        ) {
          this.stop().catch((error) => {
            console.error(
              "[PawButton] Pysäytys epäonnistui:",
              error.message
            );
          });
        }
      };

      process.stdin.on("keypress", this.#onKeypress);
    }

    console.log("[PawButton] Enter toimii tassupainikkeena.");
    console.log("[PawButton] Enter = aloita/lopeta tallennus.");
    console.log("[PawButton] Ctrl+C = lopeta ohjelma.");
  }

  press() {
    if (this.#pressed) {
      return;
    }

    this.#pressed = true;

    this.emit("pressed");
  }

  release() {
    if (!this.#pressed) {
      return;
    }

    this.#pressed = false;

    this.emit("released");
  }

  async stop() {
    if (!this.#running) {
      return;
    }

    this.#running = false;

    this.release();

    if (this.#onKeypress) {
      process.stdin.off("keypress", this.#onKeypress);
      this.#onKeypress = null;
    }

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(this.#stdinWasRaw);
      process.stdin.pause();
    }
  }

  get isPressed() {
    return this.#pressed;
  }

  get isRunning() {
    return this.#running;
  }
}