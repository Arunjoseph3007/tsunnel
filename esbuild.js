const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: [
      "src/server/index.ts",
      "src/agent/index.ts",
      "src/mock/index.ts",
    ],
    bundle: true,
    platform: "node",
    outdir: "dist",
    logLevel: "info",
  })
  .then((d) => {
    console.log("Build successful 🤩");
  })
  .catch((er) => {
    console.log("Build failed 😣");
    console.log("ERROR:", er);
  });
