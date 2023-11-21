export function generateTsconfigJsonData() {
  const content = {
    extends: "@tsconfig/node20",
    compilerOptions: {
      sourceMap: true,
      declaration: true,
      composite: true,
      lib: ["es2023", "DOM"],
    },
  };

  return content;
}
