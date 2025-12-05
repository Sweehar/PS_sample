/**
 * Unified Startup Script
 * Starts all services: Server, Worker, Docker, Prometheus, Grafana
 * Handles: Express Server, MongoDB, Redis, AI Client, Docker Monitoring
 */

import { spawn } from "child_process";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const execAsync = promisify(exec);

console.log("\n🚀 CRM Sentiment Analysis - Starting All Services\n");
console.log("=".repeat(50));

// Track processes for cleanup
const processes = [];

// Color codes for terminal output
const colors = {
  server: "\x1b[36m", // Cyan
  worker: "\x1b[33m", // Yellow
  reset: "\x1b[0m",
  error: "\x1b[31m", // Red
  success: "\x1b[32m", // Green
};

function startProcess(name, command, args, cwd, color) {
  console.log(`${color}[${name}]${colors.reset} Starting...`);

  const proc = spawn(command, args, {
    cwd,
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  processes.push({ name, proc });

  proc.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  proc.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim() && !line.includes("ExperimentalWarning")) {
        console.log(`${colors.error}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  proc.on("error", (err) => {
    console.log(
      `${colors.error}[${name}] Failed to start: ${err.message}${colors.reset}`
    );
  });

  proc.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.log(
        `${colors.error}[${name}] Exited with code ${code}${colors.reset}`
      );
      // Only exit if it's the main server that crashed
      if (name === "SERVER") {
        console.log(
          `${colors.error}[${name}] CRITICAL: Main server crashed!${colors.reset}`
        );
        shutdown();
      } else {
        console.log(
          `${colors.error}[${name}] Worker failed, but server will continue running${colors.reset}`
        );
        console.log(
          `${colors.error}[${name}] Try to restart worker in 5 seconds...${colors.reset}`
        );
        // Try to restart worker after 5 seconds
        setTimeout(() => {
          startProcess(
            "WORKER",
            "node",
            ["worker.js"],
            path.join(rootDir, "feedback-pipeline"),
            colors.worker
          );
        }, 5000);
      }
    }
  });

  return proc;
}

// Graceful shutdown
function shutdown() {
  console.log("\n\n🛑 Shutting down all services...\n");
  processes.forEach(({ name, proc }) => {
    console.log(`   Stopping ${name}...`);
    proc.kill("SIGTERM");
  });

  // Stop Docker services
  console.log("   Stopping Docker services...");
  const monitoringPath = path.resolve(rootDir, "monitoring");
  const isWindows = os.platform() === "win32";
  const dockerCommand = isWindows
    ? `docker-compose -f "${monitoringPath}/docker-compose.yml" stop prometheus grafana`
    : `docker-compose -f ${monitoringPath}/docker-compose.yml stop prometheus grafana`;

  exec(dockerCommand, (error) => {
    if (!error) {
      console.log("   ✓ Docker services stopped");
    }
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start Docker and monitoring services first (if Windows)
async function startDockerServices() {
  const isWindows = os.platform() === "win32";
  if (!isWindows) {
    console.log("✓ Skipping Docker startup (running on non-Windows OS)");
    return;
  }

  try {
    console.log("\n🐳 Checking Docker status...");
    await execAsync("docker ps > nul 2>&1", { shell: "powershell.exe" });
    console.log("✓ Docker is running");
  } catch (err) {
    console.log(
      "🐳 Docker not running, starting Docker Desktop (this may take 15-20 seconds)..."
    );
    try {
      await execAsync(
        'Start-Process "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe" -WindowStyle Hidden',
        { shell: "powershell.exe" }
      );
      console.log("⏳ Waiting for Docker to initialize...");
      await new Promise((resolve) => setTimeout(resolve, 15000));
      console.log("✓ Docker Desktop started");
    } catch (dockerStartErr) {
      console.warn(
        "⚠️  Could not auto-start Docker Desktop. Please start it manually if you want monitoring services."
      );
      return;
    }
  }

  // Start monitoring services
  console.log("📊 Starting Prometheus and Grafana...");
  try {
    const monitoringPath = path.resolve(rootDir, "monitoring");
    const command = `docker-compose -f "${monitoringPath}/docker-compose.yml" up -d prometheus grafana`;
    await execAsync(command);
    console.log("✓ Prometheus (http://localhost:9090) and Grafana (http://localhost:3001) started");
  } catch (err) {
    console.warn("⚠️  Could not start monitoring services:", err.message);
  }
}

// Start services
async function initializeServices() {
  await startDockerServices();

  // Start Main Server
  const serverProc = startProcess(
    "SERVER",
    "node",
    ["server.js"],
    path.join(rootDir, "server"),
    colors.server
  );

  // Wait a bit then start Worker (so server connects first)
  setTimeout(() => {
    const workerProc = startProcess(
      "WORKER",
      "node",
      ["worker.js"],
      path.join(rootDir, "feedback-pipeline"),
      colors.worker
    );
  }, 2000);

  console.log("\n" + "=".repeat(50));
  console.log(`${colors.success}✅ All services started!${colors.reset}`);
  console.log(`   🖥️  Server: http://localhost:5000`);
  console.log(`   📊 Prometheus: http://localhost:9090`);
  console.log(`   📈 Grafana: http://localhost:3001`);
  console.log(`   📡 Metrics: http://localhost:5000/metrics`);
  console.log(`   🔧 Worker Metrics: http://localhost:3006/metrics`);
  console.log("\n   Press Ctrl+C to stop all services\n");
  console.log("=".repeat(50) + "\n");
}

initializeServices().catch((error) => {
  console.error("Failed to initialize services:", error);
  process.exit(1);
});
