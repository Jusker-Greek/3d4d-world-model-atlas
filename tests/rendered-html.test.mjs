import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the 3D/4D world model learning atlas", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>3D\/4D World Model 学习地图 · 2026<\/title>/i);
  assert.match(html, /世界模型/);
  assert.match(html, /D4RT 为什么重要/);
  assert.match(html, /分布如何形成/);
  assert.match(html, /CONFERENCE AUDIT/);
  assert.match(html, /PAPER LIBRARY/);
  assert.match(html, /https:\/\/d4rt-paper\.github\.io\//);
});

test("removes the disposable starter preview and keeps research content in source", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /type Mode = "显式分布"/);
  assert.match(page, /CVPR 2026/);
  assert.match(page, /ICLR 2026/);
  assert.match(page, /3DV 2026/);
  assert.match(page, /ICML 2026/);
  assert.match(page, /AAAI 2026/);
  assert.match(layout, /lang="zh-CN"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("ships the standalone LLM distillation teacher class", async () => {
  const html = await readFile(
    new URL("../public/llm-distillation-teacher-class.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /<title>开源 LLM 蒸馏教师课/);
  assert.match(html, /五类方法/);
  assert.match(html, /DeepSeek-R1-0528-Qwen3-8B/);
  assert.match(html, /OpenR1-Distill-7B/);
  assert.match(html, /AMiD · ICLR 2026/);
  assert.match(html, /Compress-Distill/);
  assert.match(html, /function renderRecommendations\(\)/);
  assert.match(html, /function renderModels\(\)/);
});
