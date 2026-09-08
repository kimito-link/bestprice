// 本文(content1-3.html)をパスワード由来の鍵でAES-GCM暗号化し、shell.htmlの__VAULT__に埋め込む。
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
const { subtle } = webcrypto; const getRandomValues = (a) => webcrypto.getRandomValues(a);
const dir = process.argv[2]; const pw = process.env.BP_PW; const out = process.argv[3];
if (!pw) { console.error("BP_PW が未設定"); process.exit(1); }
const html = ["content1.html","content2.html","content3.html"].map(f => readFileSync(`${dir}/${f}`, "utf8")).join("\n");
const salt = getRandomValues(new Uint8Array(16)), iv = getRandomValues(new Uint8Array(12)), iter = 200000;
const km = await subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
const key = await subtle.deriveKey({ name:"PBKDF2", salt, iterations:iter, hash:"SHA-256" }, km, { name:"AES-GCM", length:256 }, false, ["encrypt","decrypt"]);
const ct = new Uint8Array(await subtle.encrypt({ name:"AES-GCM", iv }, key, new TextEncoder().encode(html)));
// 復号の往復確認
const back = new TextDecoder().decode(await subtle.decrypt({ name:"AES-GCM", iv }, key, ct));
if (back !== html) { console.error("round-trip mismatch"); process.exit(1); }
const b64 = (u8) => Buffer.from(u8).toString("base64");
const vault = JSON.stringify({ salt:b64(salt), iv:b64(iv), iter, ct:b64(ct) });
const shell = readFileSync(`${dir}/shell.html`, "utf8");
if (!shell.includes("__VAULT__")) { console.error("placeholder missing"); process.exit(1); }
const page = shell.replace("__VAULT__", vault);
writeFileSync(out, page);
// 平文が最終HTMLに漏れていないことを確認
const leak = ["481212600002", "お預かり販売", "撤退ライン"].filter(w => page.includes(w));
console.log(`wrote ${out} (${page.length} chars, ct ${ct.length} bytes) leak-check:`, leak.length ? "LEAK " + leak : "clean");
