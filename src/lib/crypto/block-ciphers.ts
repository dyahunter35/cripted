/** Educational block primitives. DES/Magma mirror the project's Python cores.
 * CAST tables/schedule: RFC 2144. Blowfish constants: schneier.com/academic/blowfish/.
 */
import tables from "./cipher-tables.json";
export { castCipher } from "./cast";

export type BlockCipher = (block: Uint8Array, decrypt?: boolean) => Uint8Array;
const read = (b: Uint8Array, i = 0) => new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(i, false);
const pair = (l: number, r: number) => {
  const out = new Uint8Array(8), view = new DataView(out.buffer);
  view.setUint32(0,l,false); view.setUint32(4,r,false); return out;
};
const requireLength = (b: Uint8Array, n: number) => {
  if (b.length !== n) throw new Error(`Expected ${n} bytes`);
};
const integer = (b: Uint8Array) => b.reduce((n,v) => (n<<8n)|BigInt(v),0n);
function permute(v: bigint, table: number[], width: number) {
  return table.reduce((n,p) => (n<<1n)|((v>>BigInt(width-p))&1n),0n);
}

export function desCipher(key: Uint8Array): BlockCipher {
  requireLength(key,8);
  const t=tables.des, k=permute(integer(key),t.PC1,64), keys: bigint[]=[];
  let l=Number(k>>28n),r=Number(k&0xfffffffn);
  for (const n of t.SHIFTS) {
    l=((l<<n)|(l>>>(28-n)))&0xfffffff;
    r=((r<<n)|(r>>>(28-n)))&0xfffffff;
    keys.push(permute((BigInt(l)<<28n)|BigInt(r),t.PC2,56));
  }
  return (block,decrypt=false) => {
    requireLength(block,8);
    const b=permute(integer(block),t.IP,64);
    let left=Number(b>>32n),right=Number(b&0xffffffffn);
    for (const subkey of decrypt ? [...keys].reverse() : keys) {
      const x=permute(BigInt(right),t.E,32)^subkey;
      let s=0;
      for(let i=0;i<8;i++) {
        const c=Number((x>>BigInt(42-6*i))&63n);
        s=(s<<4)|t.SBOXES[i][((c&32)>>>4)|(c&1)][(c>>>1)&15];
      }
      [left,right]=[right,(left^Number(permute(BigInt(s>>>0),t.P,32)))>>>0];
    }
    const result=permute((BigInt(right)<<32n)|BigInt(left),t.FP,64);
    return pair(Number(result>>32n),Number(result&0xffffffffn));
  };
}

export function magmaCipher(key: Uint8Array): BlockCipher {
  requireLength(key,32);
  const words=Array.from({length:8},(_,i)=>read(key,4*i));
  const keys=[...words,...words,...words,...[...words].reverse()];
  return (block,decrypt=false) => {
    requireLength(block,8);
    let l=read(block),r=read(block,4);
    for (const k of decrypt ? [...keys].reverse() : keys) {
      const sum=(r+k)>>>0;
      let s=0;
      for(let i=0;i<8;i++) s|=tables.gost[i][(sum>>>(4*i))&15]<<(4*i);
      const f=((s<<11)|(s>>>21))>>>0;
      [l,r]=[r,(l^f)>>>0];
    }
    return pair(r,l);
  };
}

export function blowfishCipher(key: Uint8Array): BlockCipher {
  if(key.length<4||key.length>56) throw new Error("Blowfish key must contain 4..56 bytes");
  const p=[...tables.blowfishP], s=tables.blowfishS.map(b=>[...b]);
  const f=(v:number)=>((((s[0][v>>>24]+s[1][(v>>>16)&255])^s[2][(v>>>8)&255])+s[3][v&255])>>>0);
  const words=(left:number,right:number,decrypt=false): [number,number] => {
    const keys=decrypt ? [...p].reverse() : p;
    for(let i=0;i<16;i++) { left=(left^keys[i])>>>0;right=(right^f(left))>>>0;[left,right]=[right,left]; }
    [left,right]=[right,left];
    return [(left^keys[17])>>>0,(right^keys[16])>>>0];
  };
  for(let i=0;i<18;i++) {
    let v=0; for(let j=0;j<4;j++) v=(v<<8)|key[(4*i+j)%key.length];
    p[i]=(p[i]^v)>>>0;
  }
  let l=0,r=0;
  for(const t of [p,...s]) for(let i=0;i<t.length;i+=2) { [l,r]=words(l,r);t[i]=l;t[i+1]=r; }
  return (block,decrypt=false) => { requireLength(block,8);return pair(...words(read(block),read(block,4),decrypt)); };
}

function gf(a:number,b:number):number {
  let result=0;
  for(let i=0;i<8;i++) { if(b&1) result^=a; a=((a<<1)^((a&128)?0x11b:0))&255;b>>>=1; }
  return result;
}
const sbox=Array.from({length:256},(_,v)=>{
  let inv=0;
  if(v) {inv=1;for(let n=0;n<254;n++) inv=gf(inv,v);}
  const rot=(n:number)=>((inv<<n)|(inv>>>(8-n)))&255;
  return inv^rot(1)^rot(2)^rot(3)^rot(4)^0x63;
});
const inverse=new Array<number>(256);sbox.forEach((v,i)=>inverse[v]=i);

/** AES-128 raw blocks (FIPS 197), same column-major state as aes_manual.py. */
export function aesCipher(key:Uint8Array):BlockCipher {
  requireLength(key,16);
  const expanded=new Uint8Array(176);expanded.set(key);
  let rc=1;
  for(let i=16;i<176;i+=4) {
    let temp=Array.from(expanded.slice(i-4,i));
    if(i%16===0) {temp=[sbox[temp[1]]^rc,sbox[temp[2]],sbox[temp[3]],sbox[temp[0]]];rc=gf(rc,2);}
    for(let j=0;j<4;j++) expanded[i+j]=expanded[i-16+j]^temp[j];
  }
  return (block,decrypt=false)=>{
    requireLength(block,16);
    const state=Uint8Array.from(block);
    const add=(r:number)=>{for(let i=0;i<16;i++)state[i]^=expanded[16*r+i];};
    const sub=(inv:boolean)=>{for(let i=0;i<16;i++)state[i]=(inv?inverse:sbox)[state[i]];};
    const shift=(inv:boolean)=>{
      const before=state.slice();
      for(let r=0;r<4;r++)for(let c=0;c<4;c++)state[r+4*c]=before[r+4*((c+(inv?4-r:r))%4)];
    };
    const mix=(inv:boolean)=>{
      const coefficients=inv?[14,11,13,9]:[2,3,1,1];
      for(let c=0;c<4;c++) {
        const a=state.slice(4*c,4*c+4);
        for(let r=0;r<4;r++)state[4*c+r]=a.reduce((v,x,j)=>v^gf(x,coefficients[(j-r+4)%4]),0);
      }
    };
    add(decrypt?10:0);
    if(decrypt) {
      for(let r=9;r>0;r--) {shift(true);sub(true);add(r);mix(true);}
      shift(true);sub(true);add(0);
    } else {
      for(let r=1;r<10;r++) {sub(false);shift(false);mix(false);add(r);}
      sub(false);shift(false);add(10);
    }
    return state;
  };
}
