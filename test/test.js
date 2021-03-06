const assert = require("assert");
const { rollup } = require("rollup");
const readFile = require("fs").readFileSync;
const { terser } = require("../");

test("minify", async () => {
  const bundle = await rollup({
    input: "test/fixtures/unminified.js",
    plugins: [terser()]
  });
  const result = await bundle.generate({ format: "cjs" });
  expect(result.code).toEqual(
    '"use strict";window.a=5,window.a<3&&console.log(4);\n'
  );
  expect(result.map).toBeFalsy();
});

test("minify via terser options", async () => {
  const bundle = await rollup({
    input: "test/fixtures/empty.js",
    plugins: [terser({ output: { comments: "all" } })]
  });
  const result = await bundle.generate({
    banner: "/* package name */",
    format: "cjs"
  });
  expect(result.code).toEqual('/* package name */\n"use strict";\n');
  expect(result.map).toBeFalsy();
});

test("minify with sourcemaps", async () => {
  const bundle = await rollup({
    input: "test/fixtures/sourcemap.js",
    plugins: [terser()]
  });
  const result = await bundle.generate({ format: "cjs", sourcemap: true });
  expect(result.map).toBeTruthy();
});

test("allow to disable source maps", async () => {
  const bundle = await rollup({
    input: "test/fixtures/sourcemap.js",
    plugins: [terser({ sourcemap: false })]
  });
  await bundle.generate({ format: "cjs" });
});

test("does not allow to pass sourceMap", async () => {
  try {
    const bundle = await rollup({
      input: "test/fixtures/sourcemap.js",
      plugins: [terser({ sourceMap: false })]
    });
    expect(true).toBeFalsy();
  } catch (error) {
    expect(error.toString()).toMatch(/sourceMap option is removed/);
  }
});

test("throw error on terser fail", async () => {
  try {
    const bundle = await rollup({
      input: "test/fixtures/failed.js",
      plugins: [
        {
          renderChunk: () => ({ code: "var = 1" })
        },
        terser()
      ]
    });
    await bundle.generate({ format: "esm" });
    expect(true).toBeFalsy();
  } catch (error) {
    expect(error.toString()).toMatch(/Name expected/);
  }
});

test("works with code splitting", async () => {
  const bundle = await rollup({
    input: ["test/fixtures/chunk-1.js", "test/fixtures/chunk-2.js"],
    experimentalCodeSplitting: true,
    plugins: [terser()]
  });
  const { output } = await bundle.generate({ format: "esm" });
  const newOutput = {};
  Object.keys(output).forEach(key => {
    const { modules, ...value } = output[key];
    newOutput[key] = value;
  });
  expect(newOutput).toMatchSnapshot();
});

test("allow to pass not string values to worker", async () => {
  const bundle = await rollup({
    input: "test/fixtures/unminified.js",
    plugins: [terser({ mangle: { properties: { regex: /^_/ } } })]
  });
  const result = await bundle.generate({ format: "cjs" });
  expect(result.code).toEqual(
    '"use strict";window.a=5,window.a<3&&console.log(4);\n'
  );
});
