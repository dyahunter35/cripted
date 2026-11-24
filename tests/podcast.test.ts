import test from "node:test";
import assert from "node:assert/strict";
import { PodcastSession } from "../src/lib/podcast-session";
class Media extends EventTarget {
  src=""; currentTime=0; readyState=0; plays=0; pauses=0; paused=true;
  getAttribute(name:string) { return name==="src" ? this.src||null : null; }
  removeAttribute() {this.src="";}
  async play() {this.plays++;this.paused=false;}
  pause() {this.pauses++;this.paused=true;}
  load() {}
}
test("No source or cache read until explicit Play, even after seeking",async()=>{
 const media=new Media();let reads=0;
 const session=new PodcastSession(media as unknown as HTMLAudioElement,"/audio.mp3",async()=>{reads++;return null;});
 session.seek(37);assert.equal(media.src,"");assert.equal(reads,0);assert.equal(media.plays,0);
 await session.play();assert.equal(media.src,"/audio.mp3");assert.equal(reads,1);
 media.readyState=1;media.dispatchEvent(new Event("loadedmetadata"));assert.equal(media.currentTime,37);
 session.pause();session.seek(52);assert.equal(media.currentTime,52);assert.equal(media.plays,1);
 session.dispose();assert.equal(media.src,"");
});
test("Cached object URLs are released on disposal",async()=>{
 const media=new Media(),revoked:string[]=[];
 const session=new PodcastSession(media as unknown as HTMLAudioElement,"/audio.mp3",async()=>"blob:cached",url=>revoked.push(url));
 await session.play();assert.equal(media.src,"blob:cached");session.dispose();assert.deepEqual(revoked,["blob:cached"]);
});
test("Late cache resolution after navigation releases URL without setting src",async()=>{
 const media=new Media(),revoked:string[]=[];let resolve!:(url:string)=>void;
 const cached=new Promise<string>(r=>{resolve=r;});
 const session=new PodcastSession(media as unknown as HTMLAudioElement,"/audio.mp3",()=>cached,url=>revoked.push(url));
 const playing=session.play();session.dispose();resolve("blob:late");await playing;
 assert.equal(media.src,"");assert.equal(media.plays,0);assert.deepEqual(revoked,["blob:late"]);
});
test("Offline completion never initializes audio and preserves active playback when adopted",async()=>{
 const media=new Media(),revoked:string[]=[];let cached:string|null=null,reads=0;
 const session=new PodcastSession(media as unknown as HTMLAudioElement,"/audio.mp3",async()=>{reads++;return cached;},url=>revoked.push(url));
 await session.useCachedSource();assert.equal(media.src,"");assert.equal(reads,0);
 await session.play();media.currentTime=12;cached="blob:download";
 await session.useCachedSource();assert.equal(media.src,"blob:download");assert.equal(media.paused,false);
 media.readyState=1;media.dispatchEvent(new Event("loadedmetadata"));assert.equal(media.currentTime,12);
 session.dispose();assert.deepEqual(revoked,["blob:download"]);
});
test("A paused session stays paused when an offline copy is adopted",async()=>{
 const media=new Media();let cached:string|null=null;
 const session=new PodcastSession(media as unknown as HTMLAudioElement,"/audio.mp3",async()=>cached,()=>{});
 await session.play();session.pause();cached="blob:saved";
 await session.useCachedSource();assert.equal(media.src,"blob:saved");assert.equal(media.paused,true);assert.equal(media.plays,1);
 session.dispose();
});
