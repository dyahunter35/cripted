/** RGB LSB protocol: a four-byte unsigned big-endian length, then UTF-8 bytes. */
export function imageCapacity(rgba: Uint8ClampedArray): number {
  if (rgba.length % 4) throw new Error("بيانات الصورة غير صالحة");
  return Math.floor((rgba.length / 4) * 3 / 8) - 4;
}
export function embedImage(rgba: Uint8ClampedArray, payload: Uint8Array): Uint8ClampedArray {
  const capacity = imageCapacity(rgba);
  if (payload.length > capacity) throw new Error(`الرسالة أكبر من سعة الصورة (${Math.max(0,capacity)} بايت)`);
  const bytes = new Uint8Array(payload.length + 4);
  new DataView(bytes.buffer).setUint32(0,payload.length,false); bytes.set(payload,4);
  const out = rgba.slice();
  for(let bit=0;bit<bytes.length*8;bit++) {
    const pixel=Math.floor(bit/3)*4+bit%3;
    out[pixel]=(out[pixel]&254)|((bytes[bit>>>3]>>>(7-bit%8))&1);
  }
  return out;
}
export function extractImage(rgba: Uint8ClampedArray): Uint8Array {
  const capacity=imageCapacity(rgba);
  if(capacity<0) throw new Error("الصورة أصغر من ترويسة الرسالة");
  const byte=(index:number)=>{
    let v=0;
    for(let n=0;n<8;n++) { const bit=index*8+n;v=(v<<1)|(rgba[Math.floor(bit/3)*4+bit%3]&1); }
    return v;
  };
  const header=Uint8Array.from({length:4},(_,i)=>byte(i));
  const length=new DataView(header.buffer).getUint32(0,false);
  if(length>capacity) throw new Error("لم يتم العثور على رسالة مخفية صالحة");
  return Uint8Array.from({length},(_,i)=>byte(i+4));
}
