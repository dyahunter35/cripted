import test from "node:test";
import assert from "node:assert/strict";
import { embedImage, extractImage, imageCapacity } from "../src/lib/steganography";
test("Image LSB: Arabic, 5001 bytes, full capacity, and unchanged alpha",()=>{
 const rgba=new Uint8ClampedArray(240*160*4).fill(128);
 assert.equal(imageCapacity(rgba),14396);
 for(const p of [new TextEncoder().encode("رسالة 🔐"),new Uint8Array(5001).fill(65),new Uint8Array(14396).fill(255),new Uint8Array(0)]) {
  const embedded=embedImage(rgba,p);assert.deepEqual(extractImage(embedded),p);
  assert.ok(embedded.every((v,i)=>i%4===3?v===rgba[i]:Math.abs(v-rgba[i])<=1));
 }
});
test("Image LSB rejects overflow and invalid headers before writing",()=>{
 const rgba=new Uint8ClampedArray(240*160*4).fill(255),original=rgba.slice();
 assert.throws(()=>embedImage(rgba,new Uint8Array(14397)));assert.deepEqual(rgba,original);
 assert.throws(()=>extractImage(rgba));assert.throws(()=>extractImage(new Uint8ClampedArray(4)));
});
