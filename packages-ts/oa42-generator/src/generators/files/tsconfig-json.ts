export function generateTsconfigJsonData() {
  const content = {
    compilerOptions: {
      target: "ES2022",
      module: "Node16",
      moduleResolution: "node16",
      declaration: true,
      sourceMap: true,
      importHelpers: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
  };

  return content;
}
