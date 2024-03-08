import fs from "fs/promises";
import YAML from "yaml";

export async function loadYAML(location: string): Promise<unknown> {
  const locationLower = location.toLowerCase();
  if (locationLower.startsWith("http://") || locationLower.startsWith("https://")) {
    const result = await fetch(location);
    const schemaRootNode = await result.json();

    return schemaRootNode;
  }

  const content = await fs.readFile(location, "utf-8");
  const schemaRootNode = YAML.parse(content);

  return schemaRootNode;
}
