import tables from "./cipher-tables.json";
const [S1,S2,S3,S4,S5,S6,S7,S8] = tables.cast;
const read = (b: Uint8Array, i = 0) => new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(i, false);
const write = (b: Uint8Array, i: number, v: number) => new DataView(b.buffer, b.byteOffset, b.byteLength).setUint32(i,v,false);
const rotl = (v: number, n: number) => ((v << n) | (v >>> (32-n))) >>> 0;
function castSetup(key: Uint8Array): number[] {
  if (key.length < 5 || key.length > 16) throw new Error("CAST key must contain 5..16 bytes");
  const x = new Uint8Array(16); x.set(key);
  const z = new Uint8Array(16), keys: number[] = [];
  for (let half=0; half<2; half++) {
    write(z, 0, read(x,0) ^ S5[x[13]] ^ S6[x[15]] ^ S7[x[12]] ^ S8[x[14]] ^ S7[x[8]]);
    write(z, 4, read(x,8) ^ S5[z[0]] ^ S6[z[2]] ^ S7[z[1]] ^ S8[z[3]] ^ S8[x[10]]);
    write(z, 8, read(x,12) ^ S5[z[7]] ^ S6[z[6]] ^ S7[z[5]] ^ S8[z[4]] ^ S5[x[9]]);
    write(z, 12, read(x,4) ^ S5[z[10]] ^ S6[z[9]] ^ S7[z[11]] ^ S8[z[8]] ^ S6[x[11]]);
    keys.push((S5[z[8]] ^ S6[z[9]] ^ S7[z[7]] ^ S8[z[6]] ^ S5[z[2]]) >>> 0);
    keys.push((S5[z[10]] ^ S6[z[11]] ^ S7[z[5]] ^ S8[z[4]] ^ S6[z[6]]) >>> 0);
    keys.push((S5[z[12]] ^ S6[z[13]] ^ S7[z[3]] ^ S8[z[2]] ^ S7[z[9]]) >>> 0);
    keys.push((S5[z[14]] ^ S6[z[15]] ^ S7[z[1]] ^ S8[z[0]] ^ S8[z[12]]) >>> 0);
    write(x, 0, read(z,8) ^ S5[z[5]] ^ S6[z[7]] ^ S7[z[4]] ^ S8[z[6]] ^ S7[z[0]]);
    write(x, 4, read(z,0) ^ S5[x[0]] ^ S6[x[2]] ^ S7[x[1]] ^ S8[x[3]] ^ S8[z[2]]);
    write(x, 8, read(z,4) ^ S5[x[7]] ^ S6[x[6]] ^ S7[x[5]] ^ S8[x[4]] ^ S5[z[1]]);
    write(x, 12, read(z,12) ^ S5[x[10]] ^ S6[x[9]] ^ S7[x[11]] ^ S8[x[8]] ^ S6[z[3]]);
    keys.push((S5[x[3]] ^ S6[x[2]] ^ S7[x[12]] ^ S8[x[13]] ^ S5[x[8]]) >>> 0);
    keys.push((S5[x[1]] ^ S6[x[0]] ^ S7[x[14]] ^ S8[x[15]] ^ S6[x[13]]) >>> 0);
    keys.push((S5[x[7]] ^ S6[x[6]] ^ S7[x[8]] ^ S8[x[9]] ^ S7[x[3]]) >>> 0);
    keys.push((S5[x[5]] ^ S6[x[4]] ^ S7[x[10]] ^ S8[x[11]] ^ S8[x[7]]) >>> 0);
    write(z, 0, read(x,0) ^ S5[x[13]] ^ S6[x[15]] ^ S7[x[12]] ^ S8[x[14]] ^ S7[x[8]]);
    write(z, 4, read(x,8) ^ S5[z[0]] ^ S6[z[2]] ^ S7[z[1]] ^ S8[z[3]] ^ S8[x[10]]);
    write(z, 8, read(x,12) ^ S5[z[7]] ^ S6[z[6]] ^ S7[z[5]] ^ S8[z[4]] ^ S5[x[9]]);
    write(z, 12, read(x,4) ^ S5[z[10]] ^ S6[z[9]] ^ S7[z[11]] ^ S8[z[8]] ^ S6[x[11]]);
    keys.push((S5[z[3]] ^ S6[z[2]] ^ S7[z[12]] ^ S8[z[13]] ^ S5[z[9]]) >>> 0);
    keys.push((S5[z[1]] ^ S6[z[0]] ^ S7[z[14]] ^ S8[z[15]] ^ S6[z[12]]) >>> 0);
    keys.push((S5[z[7]] ^ S6[z[6]] ^ S7[z[8]] ^ S8[z[9]] ^ S7[z[2]]) >>> 0);
    keys.push((S5[z[5]] ^ S6[z[4]] ^ S7[z[10]] ^ S8[z[11]] ^ S8[z[6]]) >>> 0);
    write(x, 0, read(z,8) ^ S5[z[5]] ^ S6[z[7]] ^ S7[z[4]] ^ S8[z[6]] ^ S7[z[0]]);
    write(x, 4, read(z,0) ^ S5[x[0]] ^ S6[x[2]] ^ S7[x[1]] ^ S8[x[3]] ^ S8[z[2]]);
    write(x, 8, read(z,4) ^ S5[x[7]] ^ S6[x[6]] ^ S7[x[5]] ^ S8[x[4]] ^ S5[z[1]]);
    write(x, 12, read(z,12) ^ S5[x[10]] ^ S6[x[9]] ^ S7[x[11]] ^ S8[x[8]] ^ S6[z[3]]);
    keys.push((S5[x[8]] ^ S6[x[9]] ^ S7[x[7]] ^ S8[x[6]] ^ S5[x[3]]) >>> 0);
    keys.push((S5[x[10]] ^ S6[x[11]] ^ S7[x[5]] ^ S8[x[4]] ^ S6[x[7]]) >>> 0);
    keys.push((S5[x[12]] ^ S6[x[13]] ^ S7[x[3]] ^ S8[x[2]] ^ S7[x[8]]) >>> 0);
    keys.push((S5[x[14]] ^ S6[x[15]] ^ S7[x[1]] ^ S8[x[0]] ^ S8[x[13]]) >>> 0);
  }
  return keys;
}
export function castCipher(key: Uint8Array) {
  const keys = castSetup(key), rounds = key.length <= 10 ? 12 : 16;
  return (block: Uint8Array, decrypt = false): Uint8Array => {
    if (block.length !== 8) throw new Error("CAST block must contain 8 bytes");
    let l=read(block), r=read(block,4);
    for (let j=0; j<rounds; j++) {
      const i=decrypt ? rounds-1-j : j, n=keys[i+16]&31;
      const v=rotl(i%3===0 ? keys[i]+r : i%3===1 ? keys[i]^r : keys[i]-r,n);
      const a=v>>>24,b=(v>>>16)&255,c=(v>>>8)&255,d=v&255;
      const f=i%3===0 ? (S1[a]^S2[b])-S3[c]+S4[d] : i%3===1 ? ((S1[a]-S2[b]+S3[c])^S4[d]) : ((S1[a]+S2[b])^S3[c])-S4[d];
      [l,r]=[r,(l^f)>>>0];
    }
    const out=new Uint8Array(8);write(out,0,r);write(out,4,l);return out;
  };
}
