import { createReadStream } from "fs";
import {
  createServer,
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from "http";
import { colorOut } from "../utils/color";

const handlers: Record<
  string,
  RequestListener<typeof IncomingMessage, typeof ServerResponse>
> = {
  echo: (req, res) => {
    res.write("Method ->" + req.method + "\n");
    res.write("Url ->" + req.url + "\n");
    res.write("Headers ->" + "\n");
    for (const key in req.headers) {
      res.write("  " + key + req.headers[key] + "\n");
    }

    res.end();
  },
  json: (req, res) => {
    res.setHeader("content-type", "application/json");
    res.write(JSON.stringify({ foo: "bar", num: 1, obj: { baz: 100 } }));
    res.end();
  },
  download: (req, res) => {
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="MyFileName.js"'
    );

    createReadStream("package.json").pipe(res);
  },
  html: (req, res) => {
    const HtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zapier Style Landing Page</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white">
    <header class="bg-orange-500 text-white py-4 px-6 flex justify-between items-center">
        <h1 class="text-xl font-bold">BrandName</h1>
        <nav>
            <a href="#" class="px-4 hover:underline">Features</a>
            <a href="#" class="px-4 hover:underline">Pricing</a>
            <a href="#" class="px-4 hover:underline">Contact</a>
            <a href="#" class="ml-4 px-4 py-2 bg-white text-orange-500 rounded shadow hover:bg-gray-100">Sign Up</a>
        </nav>
    </header>
    <main class="flex flex-col items-center text-center py-20 px-6">
        <h2 class="text-4xl font-bold text-gray-800 max-w-2xl">Automate Your Workflows with Ease</h2>
        <p class="text-gray-600 mt-4 max-w-lg">Connect your favorite apps, automate repetitive tasks, and get more done in less time.</p>
        <a href="#" class="mt-6 inline-block bg-orange-500 text-white py-3 px-6 rounded-lg shadow-lg text-lg hover:bg-orange-600">Get Started Free</a>
    </main>
</body>
</html>
`;
    res.setHeader("content-type", "text/html");
    res.write(HtmlContent);
    res.end();
  },
  header: (req, res) => {
    res.setHeader("custom", "value");
    res.end();
  },
  delimiter: (req, res) => {
    res.write(
      "Test for delimiter. This page should contain the delimiter | lorem || ipsum|||dot"
    );
    res.end();
  },
  escape: (req, res) => {
    res.write(
      "Test for escape. This page should contain the escape ~ lorem ~~ ipsum~~~dot"
    );
    res.end();
  },
  parser: (req, res) => {
    res.write(
      "Test for delimiter. This page should contain the delimiter | lorem || ipsum|||dot"
    );
    res.write(
      "Test for escape. This page should contain the escape ~ lorem ~~ ipsum~~~dot"
    );
    res.end();
  },
};

export default function createMockServer() {
  const server = createServer((req, res) => {
    console.log(
      colorOut("[MOCK]", "Green"),
      "<-",
      colorOut(req.method!, "Yellow"),
      req.url
    );

    res.on("close", () => {
      console.log(
        colorOut("[MOCK]", "Red"),
        "->",
        colorOut(req.method!, "Yellow"),
        res.statusCode,
        req.url
      );
    });

    let url = req.url || "/echo";
    url = url.slice(1);
    if (!(url in handlers)) {
      url = "echo";
    }
    handlers[url](req, res);
  });
  server.on("error", (er) => console.log(er));

  return server;
}
