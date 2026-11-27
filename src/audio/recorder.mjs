
import { spawn } from "node:child_process";
import {
  mkdtemp,
  readFile,
  rm,
  access
} from "node:fs/promises";
import path from "node:path";

export class AudioRecorder {
  #process = null;
  #directory = null;
  #filePath = null;
  #recording = false;
  #maxSeconds;
  #device;
  #closePromise = null;
  #stderr = "";
  #stopRequested = false;

  constructor(options = {}) {
    this.#maxSeconds = options.maxRecordingSeconds ?? 15;
    this.#device = options.device ?? "default";

    if (
      !Number.isFinite(this.#maxSeconds) ||
      this.#maxSeconds <= 0
    ) {
      throw new RangeError("maxRecordingSeconds must be positive");
    }
  }

  async start() {
    if (this.#process) {
      throw new Error("Recorder is already active");
    }

    this.#directory = await mkdtemp("/dev/shm/LLM-speech-local-DEMO-");
    this.#filePath = path.join(this.#directory, "recording.wav");
    this.#stderr = "";
    this.#stopRequested = false;

    const child = spawn("arecord", [
      "-D", this.#device,
      "-f", "S16_LE",
      "-r", "16000",
      "-c", "1",
      "-t", "wav",
      "-d", String(this.#maxSeconds),
      this.#filePath
    ], {
      stdio: ["ignore", "ignore", "pipe"]
    });

    this.#process = child;

    child.stderr.setEncoding("utf8");

    child.stderr.on("data", chunk => {
      this.#stderr += chunk;
    });

    this.#closePromise = new Promise(resolve => {
      child.once("close", (code, signal) => {
        this.#recording = false;
        resolve({ code, signal });
      });
    });

    try {
      await new Promise((resolve, reject) => {
        child.once("spawn", resolve);
        child.once("error", reject);
      });

      await this.#waitForRecordingStart();

      this.#recording = true;
    } catch (error) {
      await this.#terminate();
      await this.#cleanup();

      throw new Error(
        `Could not start audio recording: ${error.message}`,
        { cause: error }
      );
    }
  }

  async #waitForRecordingStart() {
    const timeoutMs = 5000;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      if (this.#stderr.includes("Recording WAVE")) {
        return;
      }

      if (
        this.#process.exitCode !== null ||
        this.#process.signalCode !== null
      ) {
        const result = await this.#closePromise;

        throw new Error(
          `arecord exited before recording started. ` +
          `Exit code: ${result.code}, signal: ${result.signal}\n` +
          this.#stderr
        );
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    throw new Error(
      `Timed out waiting for microphone. ${this.#stderr}`
    );
  }

  async stop() {
    if (!this.#process) {
      return null;
    }

    const child = this.#process;

    try {
      if (
        child.exitCode === null &&
        child.signalCode === null
      ) {
        this.#stopRequested = true;
        child.kill("SIGINT");
      }

      const result = await this.#closePromise;

      const expectedInterrupt =
        this.#stopRequested &&
        result.code === 1 &&
        result.signal === null;

      if (result.code !== 0 && !expectedInterrupt) {
        throw new Error(
          `Unexpected arecord termination: ${JSON.stringify(result)}\n` +
          this.#stderr
        );
      }

      await access(this.#filePath);

      const audio = await readFile(this.#filePath);

      if (
        audio.length <= 44 ||
        audio.toString("ascii", 0, 4) !== "RIFF" ||
        audio.toString("ascii", 8, 12) !== "WAVE"
      ) {
        throw new Error("Invalid or empty WAV recording");
      }

      return audio;
    } finally {
      await this.#cleanup();
    }
  }

  async #terminate() {
    const child = this.#process;

    if (!child) {
      return;
    }

    if (
      child.exitCode === null &&
      child.signalCode === null
    ) {
      child.kill("SIGINT");
    }

    await this.#closePromise;
  }

  async #cleanup() {
    this.#recording = false;
    this.#process = null;
    this.#closePromise = null;

    if (this.#directory) {
      await rm(this.#directory, {
        recursive: true,
        force: true
      });
    }

    this.#directory = null;
    this.#filePath = null;
  }

  get isRecording() {
    return this.#recording;
  }
}
