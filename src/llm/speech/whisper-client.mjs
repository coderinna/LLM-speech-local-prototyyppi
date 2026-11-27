
import { spawn } from "node:child_process";
import {
  mkdtemp,
  readFile,
  writeFile,
  rm
} from "node:fs/promises";
import path from "node:path";

export class WhisperClient {
  constructor(options = {}) {
    this.language = options.language ?? "fi";

    this.executable = options.executable ??
      "./whisper.cpp/build/bin/whisper-cli";

    this.modelPath = options.modelPath ??
      "./whisper.cpp/models/ggml-small.bin";

    this.timeoutMs = options.timeoutMs ?? 30000;
  }

  async transcribe(audioBuffer) {
    if (!Buffer.isBuffer(audioBuffer)) {
      throw new TypeError("audioBuffer must be a Buffer");
    }

    if (audioBuffer.length <= 44) {
      throw new Error("Audio buffer is empty or invalid");
    }

    if (
      audioBuffer.toString("ascii", 0, 4) !== "RIFF" ||
      audioBuffer.toString("ascii", 8, 12) !== "WAVE"
    ) {
      throw new Error("Audio buffer must contain WAV data");
    }

    const directory = await mkdtemp(
      "/dev/shm/LLM-speech-local-DEMO-whisper-"
    );

    const audioPath = path.join(directory, "input.wav");
    const outputPrefix = path.join(directory, "result");
    const jsonPath = `${outputPrefix}.json`;

    try {
      await writeFile(audioPath, audioBuffer);

      await this.#run([
        "-m", this.modelPath,
        "-f", audioPath,
        "-l", this.language,
        "-ojf",
        "-of", outputPrefix,
        "-np"
      ]);

      const jsonText = await readFile(jsonPath, "utf8");
      const metadata = JSON.parse(jsonText);

      if (!Array.isArray(metadata.transcription)) {
        throw new Error(
          "Whisper JSON does not contain a transcription array"
        );
      }

      const segments = metadata.transcription;

      const text = segments
        .map(segment => segment.text ?? "")
        .join(" ")
        .trim();

      // Tulostetaan Whisperin JSON-rakenne tarkastelua varten.
      console.log(
        "[Whisper JSON]",
        JSON.stringify(metadata, null, 2)
      );

      return {
        text,
        segments,
        metadata
      };
    } finally {
      await rm(directory, {
        recursive: true,
        force: true
      });
    }
  }

  #run(args) {
    return new Promise((resolve, reject) => {
      const child = spawn(this.executable, args, {
        stdio: ["ignore", "pipe", "pipe"]
      });

      let stderr = "";
      let settled = false;

      const timeout = setTimeout(() => {
        child.kill("SIGTERM");

        finish(new Error(
          `Whisper timed out after ${this.timeoutMs} ms`
        ));
      }, this.timeoutMs);

      const finish = error => {
        if (settled) return;

        settled = true;
        clearTimeout(timeout);

        if (error) {
          reject(error);
        } else {
          resolve();
        }
      };

      child.stderr.setEncoding("utf8");

      child.stderr.on("data", chunk => {
        stderr += chunk;
      });

      child.once("error", error => {
        finish(new Error(
          `Could not start Whisper: ${error.message}`,
          { cause: error }
        ));
      });

      child.once("close", code => {
        if (code !== 0) {
          finish(new Error(
            `Whisper failed (${code}): ${stderr.trim()}`
          ));
          return;
        }

        finish();
      });
    });
  }
}
