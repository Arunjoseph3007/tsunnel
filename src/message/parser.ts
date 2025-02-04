import { ControllMsg, MsgType } from "./types";

export const unmarshall = (buff: Buffer<ArrayBufferLike>): ControllMsg => {
  const type = buff.at(0)! as MsgType;
  const requestId = buff.subarray(1, 9).toString();
  const data = buff.subarray(9);
  return { data, requestId, type };
};

export const marshall = (ctrlMsg: ControllMsg): Buffer<ArrayBufferLike> => {
  const typeBuf = Buffer.from([ctrlMsg.type]);
  const requestIdBuf = Buffer.alloc(8);
  if (ctrlMsg.requestId) {
    Buffer.from(ctrlMsg.requestId).copy(requestIdBuf);
  }
  return Buffer.concat([typeBuf, requestIdBuf, ctrlMsg.data]);
};
