import { ControllMsg, MsgType } from "../message/types";

export const HeaderLength = 12; // 1+1+2+8

// TODO: instead of reassign on every update, can we do this with one large buffer and length property
/*
Packet
___________________________________________________________
| 1 Byte version | 1 Bytes MsgType | 2 Byte packet length |
| 8 Bytes Request ID ......... | Data in binary.......... |
|_________________________________________________________|
*/
export default class MessageBuffer {
  private buffer: Buffer;

  constructor() {
    this.buffer = Buffer.allocUnsafe(0);
  }

  static marshall(ctrlMsg: ControllMsg): Buffer<ArrayBufferLike> {
    const buff = Buffer.allocUnsafe(ctrlMsg.length);

    buff.writeUInt8(ctrlMsg.version, 0);
    buff.writeUInt8(ctrlMsg.type, 1);
    buff.writeUInt16BE(ctrlMsg.length, 2);
    buff.write(ctrlMsg.requestId, 4);

    ctrlMsg.data.copy(buff, 12);

    return buff;
  }

  public append(data: Buffer<ArrayBufferLike>) {
    this.buffer = Buffer.concat([this.buffer, data]);
  }

  public extractFramedMessages(): ControllMsg[] {
    let output: ControllMsg[] = [];

    while (this.buffer.length >= HeaderLength) {
      const version = this.buffer.readUInt8(0);
      const msgType = this.buffer.readUInt8(1) as MsgType;
      const packetLength = this.buffer.readUInt16BE(2);
      const requestId = this.buffer.subarray(4, 4 + 8).toString();

      // Unkonw version
      if (version != 1) {
        throw new Error(`Unknown protocol version ${version}. Expected 1`);
      }

      // Message not fully received. Will be processed next time
      if (this.buffer.length < packetLength) {
        break;
      }

      const msgDataBuf = this.buffer.subarray(HeaderLength, packetLength);
      const extractedMsg: ControllMsg = {
        requestId,
        version,
        data: msgDataBuf,
        length: packetLength,
        type: msgType,
      };
      output.push(extractedMsg);
      this.buffer = this.buffer.subarray(packetLength);
    }

    return output;
  }
}
