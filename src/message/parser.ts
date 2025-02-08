import { ControllMsg, MsgType } from "./types";

export const unmarshall = (buff: Buffer<ArrayBufferLike>): ControllMsg => {
  const version = buff.readUInt8(0);
  const msgType = buff.readUInt8(1) as MsgType;
  const packetLength = buff.readUInt16BE(2);
  const requestId = buff.subarray(4, 4 + 8).toString();
  const msgData = buff.subarray(4 + 8);

  const ctrlMsg: ControllMsg = {
    data: msgData,
    requestId,
    type: msgType,
    length: packetLength,
    version,
  };

  return ctrlMsg;
};

export const marshall = (ctrlMsg: ControllMsg): Buffer<ArrayBufferLike> => {
  const buff = Buffer.allocUnsafe(ctrlMsg.length);

  buff.writeUInt8(ctrlMsg.version, 0);
  buff.writeUInt8(ctrlMsg.type, 1);
  buff.writeUInt16BE(ctrlMsg.length, 2);
  buff.write(ctrlMsg.requestId, 4);

  ctrlMsg.data.copy(buff, 12);

  return buff;
};
