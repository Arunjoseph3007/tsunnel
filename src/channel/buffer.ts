import { ControllMsg, MsgType } from "../message/types";

export const smartProcessData = (
  data: Buffer<ArrayBufferLike>
): Buffer<ArrayBufferLike> => {
  return data;
};

/*
Packet
___________________________________________________________
| 1 Byte version | 1 Bytes MsgType | 2 Byte packet length |
| 8 Bytes Request ID ......... | Data in binary.......... |
___________________________________________________________ 
*/

const HeaderLength = 12; // 1+1+2+8

export const smartSplitData = (
  data: Buffer<ArrayBufferLike>
): Buffer<ArrayBufferLike>[] => {
  let output: Buffer<ArrayBufferLike>[] = [];

  while (data.length >= HeaderLength) {
    const version = data.readUInt8(0);
    const msgType = data.readUInt8(1) as MsgType;
    const packetLength = data.readUInt16BE(2);
    const requesId = data.subarray(4, 4 + 8).toString();

    // Unkonw version
    if (version != 1) {
      throw new Error(`Unknown protocol version ${version}. Expected 1`);
    }

    // Message not fully received. Will be processed next time
    if (data.length < packetLength) {
      break;
    }

    const msgDataBuf = data.subarray(0, packetLength);
    data = data.subarray(packetLength);
    output.push(msgDataBuf);
  }

  output.push(data);

  return output;
};
