import { generateApi } from "@elyspio/vite-eslint-config";
import * as path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..", "src");

await generateApi("https://localhost:7252/swagger/v1/swagger.json", projectRoot, "v1");
