import { ControllMsg, MsgType } from "./types";

export const unmarshall = (
  data: Buffer<ArrayBufferLike>
): Required<ControllMsg> => {
  return JSON.parse(data.toString());
};

export const marshall = (ctrlMsg: ControllMsg): string => {
  return JSON.stringify(ctrlMsg);
};
