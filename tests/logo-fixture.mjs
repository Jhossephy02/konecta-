import {deflateSync} from 'node:zlib';
export function logoPng(){
 const crc=data=>{let n=0xffffffff;for(const b of data){n^=b;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return(n^0xffffffff)>>>0;};
 const chunk=(type,data)=>{const t=Buffer.from(type),length=Buffer.alloc(4),checksum=Buffer.alloc(4);length.writeUInt32BE(data.length);checksum.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([length,t,data,checksum]);};
 const size=64,header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=2;const pixels=Buffer.alloc(size*(1+size*3));for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*(1+size*3)+1+x*3;const border=x<4||x>59||y<4||y>59;pixels[i]=border?255:20;pixels[i+1]=border?255:101;pixels[i+2]=border?255:217;}return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
