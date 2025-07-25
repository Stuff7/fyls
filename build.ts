import fs from "fs";
import path from "path";
import esbuild, {
  type Plugin,
  type PluginBuild,
  type BuildOptions,
} from "esbuild";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { compile } from "svelte/compiler";
import { fileURLToPath } from "url";
import { cp } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const PUBLIC = path.join(ROOT, "public");
const BUILD = path.join(ROOT, "dist");

const CONFIG = {
  tailwind: {
    inputCss: path.join(SRC, "styles.css"),
    outputCss: path.join(BUILD, "styles.css"),
    contentGlobs: ["**/*.svelte", "**/*.html"].map((glob) =>
      path.join(SRC, glob),
    ),
  },
  svelte: {
    entryPoint: path.join(SRC, "main.js"),
    outputBundle: path.join(BUILD, "bundle.js"),
    globalName: "app",
    format: "iife" as BuildOptions["format"],
    minify: false,
    sourcemap: false,
  },
  copy: {
    from: PUBLIC,
    to: BUILD,
  },
};

async function buildTailwind(): Promise<void> {
  const cssInput = await fs.promises.readFile(CONFIG.tailwind.inputCss, "utf8");

  const result = await postcss([
    tailwindcss({
      content: CONFIG.tailwind.contentGlobs,
    } as any),
  ]).process(cssInput, {
    from: CONFIG.tailwind.inputCss,
    to: CONFIG.tailwind.outputCss,
    map: false,
  });

  await fs.promises.writeFile(CONFIG.tailwind.outputCss, result.css);
  console.log(
    `✅ TailwindCSS compiled to ${path.relative(ROOT, CONFIG.tailwind.outputCss)}`,
  );
}

const sveltePlugin: Plugin = {
  name: "svelte",
  setup(build: PluginBuild) {
    build.onLoad({ filter: /\.svelte$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, "utf8");
      const { js, warnings } = compile(source, {
        filename: args.path,
        generate: "client",
      });
      if (warnings.length) {
        for (const warning of warnings) {
          console.warn(warning);
        }
      }
      return {
        contents: js.code,
        loader: "js",
      };
    });
  },
};

async function buildSvelte(): Promise<void> {
  await esbuild.build({
    entryPoints: [CONFIG.svelte.entryPoint],
    bundle: true,
    outfile: CONFIG.svelte.outputBundle,
    plugins: [sveltePlugin],
    format: CONFIG.svelte.format,
    globalName: CONFIG.svelte.globalName,
    minify: CONFIG.svelte.minify,
    sourcemap: CONFIG.svelte.sourcemap,
  });

  console.log(
    `✅ Svelte app bundled to ${path.relative(ROOT, CONFIG.svelte.outputBundle)}`,
  );
}

async function copyPublic(): Promise<void> {
  await cp(CONFIG.copy.from, CONFIG.copy.to, { recursive: true, force: true });
  console.log(
    `✅ ${path.relative(ROOT, CONFIG.copy.from)}/ copied to ${path.relative(ROOT, CONFIG.copy.to)}/`,
  );
}

async function fullBuild(): Promise<void> {
  await Promise.all([copyPublic(), buildTailwind(), buildSvelte()]);
}

const shouldWatch = process.argv.includes("--watch");

await fullBuild();

if (shouldWatch) {
  let debounce: NodeJS.Timeout | null = null;
  fs.watch(SRC, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    console.log(`📂 File changed: ${filename}`);
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      fullBuild().catch((err) => console.error("💥 Build failed:", err));
    }, 100);
  });

  console.log(`👀 Watching ${path.relative(ROOT, SRC)} for changes...`);
}
