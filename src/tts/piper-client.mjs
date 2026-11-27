
import { spawn } from "node:child_process";
import {
  mkdtemp,
  rm
} from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const VOICES = {
  harri: {
    modelPath: "./models/tts/fi_FI-harri-medium.onnx",
    configPath: "./models/tts/fi_FI-harri-medium.onnx.json"
  },
  asmo: {
    modelPath: "./models/tts/fi_FI-asmo-medium.onnx",
    configPath: "./models/tts/fi_FI-asmo-medium.onnx.json"
  }
};

export class PiperClient {
  constructor({
    pythonPath = "./.venv-tts/bin/python",
    playerPath = "/usr/bin/aplay",
    voice = process.env["LLM-speech-local-DEMO_VOICE"] || "harri"
  } = {}) {
    this.pythonPath = pythonPath;
    this.playerPath = playerPath;
    this.setVoice(voice);
  }

  setVoice(voice) {
    if (!VOICES[voice]) {
      throw new Error(`Tuntematon ääni: ${voice}`);
    }

    this.voice = voice;
  }

  async speak(text) {
    if (typeof text !== "string" || !text.trim()) {
      throw new TypeError("Puheteksti ei voi olla tyhjä");
    }

    const selectedVoice = VOICES[this.voice];

    const directory = await mkdtemp(
      path.join(os.tmpdir(), "LLM-speech-local-DEMO-tts-")
    );

    const outputPath = path.join(directory, "response.wav");

    try {
      await this.#run(this.pythonPath, [
        "-m",
        "piper",
        "--model",
        selectedVoice.modelPath,
        "--config",
        selectedVoice.configPath,
        "--output_file",
        outputPath,
        "--data-dir",
        "./models/tts"
      ], text.trim());

      await this.#run(this.playerPath, [outputPath]);

      return true;
    } finally {
      await rm(directory, {
        recursive: true,
        force: true
      });
    }
  }

  #run(command, args, input = null) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ["pipe", "ignore", "pipe"]
      });

      let stderr = "";

      child.stderr.setEncoding("utf8");
      child.stderr.on("data", chunk => {
        stderr += chunk;
      });

      child.on("error", reject);

      child.on("close", code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(
            `${command} epäonnistui (exit ${code}): ${stderr.trim()}`
          ));
        }
      });

      child.stdin.end(input ?? "");
    });
  }
}
