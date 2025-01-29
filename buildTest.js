const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["./**/*.test.ts"],
    bundle: true,
    platform: "node",
    outdir: "dist/test",
    logLevel: "info",
  })
  .then((d) => {
    console.log("Tests Built successfully 🤩");
  })
  .catch((er) => {
    console.log("Build failed 😣");
    console.log("ERROR:", er);
  });
