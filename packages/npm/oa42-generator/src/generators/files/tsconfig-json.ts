export function generateTsconfigJsonData() {
  const content = {
    extends: "@tsconfig/node20",
    compilerOptions: {
      outDir: "./out",
      rootDir: "./src",
      sourceMap: true,
      declaration: true,
      lib: ["es2023", "DOM"],
    },
    include: ["./src"],
  };

  return content;
}
