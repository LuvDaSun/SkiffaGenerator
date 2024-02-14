export function generateTsconfigJsonData() {
  const content = {
    extends: "@tsconfig/node20",
    compilerOptions: {
      outDir: "./out",
      rootDir: "./src",
      sourceMap: true,
      declaration: true,
    },
    include: ["src"],
  };

  return content;
}
