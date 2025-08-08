import { generateApi } from "@elyspio/vite-eslint-config";
import { fileURLToPath } from "node:url";
import * as path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..", "src");

await generateApi("https://localhost:7252/openapi/v1.json", projectRoot, "v1");
