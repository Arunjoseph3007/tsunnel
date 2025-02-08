const child_process = require("child_process");
const { randomBytes } = require("crypto");
const esbuild = require("esbuild");
const fs = require("fs");

const fileToWatch = process.argv[2];
const fileId = randomBytes(16).toString("hex");
const outFile = "dist/watch_output/" + fileId + ".js";

const comipleAndRun = async () => {
  const buildContext = await esbuild.context({
    entryPoints: [fileToWatch],
    bundle: true,
    platform: "node",
    outfile: outFile,
    logLevel: "info",
  });

  await buildContext.watch();

  const checkingForFile = setInterval(() => {
    console.log("Checking if file exists");
    const exists = fs.existsSync(outFile);

    if (!exists) {
      console.log("file not found yet");
      return;
    }

    clearInterval(checkingForFile);

    console.log("Starting child process");
    const childProcc = child_process.spawn("node", [
      "--watch",
      "--no-warnings",
      outFile,
    ]);

    process.stdin.pipe(childProcc.stdin);
    childProcc.stdout.pipe(process.stdout);
    childProcc.stderr.pipe(process.stderr);

    function cleanUp() {
      fs.unlink(outFile, (err) => {
        if (err) {
          console.log("error deleting", err);
        } else {
          console.log("Deleted temporary output file", outFile);
        }
      });
    }

    process.on("SIGINT", cleanUp);
    process.on("SIGKILL", cleanUp);
  }, 1000);
};

comipleAndRun();
