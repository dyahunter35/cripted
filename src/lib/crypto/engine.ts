import { aesCipher, desCipher, magmaCipher, blowfishCipher, castCipher, type BlockCipher } from "./block-ciphers";
import { sha256Bytes, rc4Crypt, rc5Setup, rc5Block, rc6Setup, rc6Block, ideaExpandKey, ideaInvertKeys, ideaCryptBlock } from "./webcrypto-helper";

export const cipherIds = ["des","aes","rc5","idea","gost","rc4","rc6","cast","blowfish"] as const;
export type CipherId = typeof cipherIds[number];
export function isCipherId(value:string):value is CipherId { return cipherIds.some(id=>id===value); }
export function blockSize(id:CipherId) { return id==="aes"||id==="rc6" ? 16 : 8; }
export function createBlockCipher(id:Exclude<CipherId,"rc4">, key:Uint8Array):BlockCipher {
  switch(id) {
    case "aes": return aesCipher(key.slice(0,16));
    case "des": return desCipher(key.slice(0,8));
    case "gost": return magmaCipher(key);
    case "cast": return castCipher(key.slice(0,16));
    case "blowfish": return blowfishCipher(key.slice(0,16));
    case "rc5": {const s=rc5Setup(key.slice(0,16));return (b,d=false)=>rc5Block(b,s,12,d?"dec":"enc");}
    case "rc6": {const s=rc6Setup(key.slice(0,16));return (b,d=false)=>rc6Block(b,s,20,d?"dec":"enc");}
    case "idea": {const ek=ideaExpandKey(key.slice(0,16)),dk=ideaInvertKeys(ek);return (b,d=false)=>ideaCryptBlock(b,d?dk:ek);}
  }
}
export function pad(data:Uint8Array,size:number) {
  const n=size-data.length%size, out=new Uint8Array(data.length+n);out.set(data);out.fill(n,data.length);return out;
}
export function unpad(data:Uint8Array,size:number) {
  const n=data[data.length-1];
  if(!data.length||data.length%size||n<1||n>size||!data.slice(-n).every(v=>v===n)) throw new Error("المفتاح أو حشو النص المشفر غير صالح");
  return data.slice(0,-n);
}
/** Matches the educational Python password API: SHA-256, ECB + PKCS#7 (or RC4). */
export async function crypt(id:CipherId,data:Uint8Array,password:string,decrypt=false) {
  const key=await sha256Bytes(password);
  if(id==="rc4") return rc4Crypt(key,data);
  const size=blockSize(id), cipher=createBlockCipher(id,key);
  if(decrypt&&(!data.length||data.length%size)) throw new Error(`يجب أن يكون طول النص المشفر مضاعفاً لـ ${size} بايت`);
  const input=decrypt?data:pad(data,size),out=new Uint8Array(input.length);
  for(let i=0;i<input.length;i+=size) out.set(cipher(input.subarray(i,i+size),decrypt),i);
  return decrypt?unpad(out,size):out;
}

export function flipBit(data:Uint8Array,index:number):Uint8Array {
  if(!data.length) return data.slice();
  const out=data.slice(),bit=((index%(data.length*8))+data.length*8)%(data.length*8);
  out[Math.floor(bit/8)]^=1<<(bit%8);return out;
}
