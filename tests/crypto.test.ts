import test from "node:test";
import assert from "node:assert/strict";
import {aesCipher,desCipher,magmaCipher,blowfishCipher,castCipher} from "../src/lib/crypto/block-ciphers";
import {bytesToHex,hexToBytes,rc5Setup,rc5Block,rc6Setup,rc6Block,ideaExpandKey,ideaCryptBlock,ideaInvertKeys,rc4Crypt} from "../src/lib/crypto/webcrypto-helper";
import {cipherIds,crypt,flipBit} from "../src/lib/crypto/engine";
import {execFileSync} from "node:child_process";
const h=hexToBytes;
const vectors = [
  ["AES (FIPS 197)",aesCipher,"000102030405060708090a0b0c0d0e0f","00112233445566778899aabbccddeeff","69c4e0d86a7b0430d8cdb78070b4c55a"],
  ["DES",desCipher,"133457799bbcdff1","0123456789abcdef","85e813540f0ab405"],
  ["Magma (RFC 8891)",magmaCipher,"ffeeddccbbaa99887766554433221100f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff","fedcba9876543210","4ee901e5c2d8ca3d"],
  ["CAST-128 (RFC 2144)",castCipher,"0123456712345678234567893456789a","0123456789abcdef","238b4fe5847e44b2"],
  ["CAST-80 (RFC 2144)",castCipher,"01234567123456782345","0123456789abcdef","eb6a711a2c02271b"],
  ["CAST-40 (RFC 2144)",castCipher,"0123456712","0123456789abcdef","7ac816d16e9b302e"],
  ["Blowfish (Schneier vectors)",blowfishCipher,"0000000000000000","0000000000000000","4ef997456198dd78"],
] as const;
for(const [name,setup,key,plain,expected] of vectors) test(name,()=>{
  const cipher=setup(h(key));assert.equal(bytesToHex(cipher(h(plain))),expected);
  assert.equal(bytesToHex(cipher(h(expected),true)),plain);
});
test("RC5-32/12/16 reference block",()=>{
 const s=rc5Setup(new Uint8Array(16)),p=new Uint8Array(8),ct=rc5Block(p,s);
 assert.equal(bytesToHex(ct),"21a5dbee154b8f6d");assert.deepEqual(rc5Block(ct,s,12,"dec"),p);
});
test("RC6-32/20/16 reference block",()=>{
 const s=rc6Setup(new Uint8Array(16)),p=new Uint8Array(16),ct=rc6Block(p,s);
 assert.equal(bytesToHex(ct),"8fc3a53656b1f778c129df4e9848a41e");assert.deepEqual(rc6Block(ct,s,20,"dec"),p);
});
test("IDEA reference block",()=>{
 const ek=ideaExpandKey(h("00010002000300040005000600070008")),p=h("0000000100020003"),ct=ideaCryptBlock(p,ek);
 assert.equal(bytesToHex(ct),"11fbed2b01986de5");assert.deepEqual(ideaCryptBlock(ct,ideaInvertKeys(ek)),p);
});
test("RC4 known answer",()=>assert.equal(bytesToHex(rc4Crypt(new TextEncoder().encode("Key"),new TextEncoder().encode("Plaintext"))),"bbf316e8d940af0ad3"));
for(const id of cipherIds) test(`${id}: UTF-8, empty and full-block round trips`,async()=>{
 for(const text of ["","سري 🔐\nنص مع فراغات  ","1234567812345678"]) {
  const p=new TextEncoder().encode(text),ct=await crypt(id,p,"password");
  assert.deepEqual(await crypt(id,ct,"password",true),p);
 }
});
test("UTF-8 avalanche inputs differ by exactly one bit",()=>{
 const original=new TextEncoder().encode("سري 🔐");
 for(let i=0;i<original.length*8;i++) {
  const b=flipBit(original,i);assert.equal(b.length,original.length);
  assert.equal(b.reduce((n,v,j)=>n+((v^original[j]).toString(2).match(/1/g)||[]).length,0),1);
 }
});
test("Reject malformed ciphertext and padding",async()=>{
 assert.throws(()=>hexToBytes("gg"));assert.throws(()=>hexToBytes("abc"));
 await assert.rejects(crypt("aes",new Uint8Array(3),"password",true));
 await assert.rejects(crypt("rc5",new Uint8Array(8),"password",true));
});
test("All nine browser password APIs match Python and independent library fixtures",async()=>{
 const fixtures=JSON.parse(execFileSync("python3",["tests/cipher_fixture.py"],{encoding:"utf8"})) as {algo:typeof cipherIds[number];password:string;text:string;hex:string}[];
 for(const f of fixtures) {
  const data=new TextEncoder().encode(f.text);
  assert.equal(bytesToHex(await crypt(f.algo,data,f.password)),f.hex,f.algo);
  assert.deepEqual(await crypt(f.algo,h(f.hex),f.password,true),data,f.algo);
 }
});
