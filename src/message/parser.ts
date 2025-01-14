import { ControllMsg, MsgType } from "./types";

export const unmarshall = (
  data: Buffer<ArrayBufferLike>
): Required<ControllMsg> => {
  const [type, requestId, ...chunks] = data.toString().split("::");

  if (!(type in MsgType)) {
    throw "Unknown MsgType " + type;
  }

  return {
    type: type as MsgType,
    requestId,
    data: chunks ? chunks.join("::") : "",
  };
};

export const marshall = (ctrlMsg: ControllMsg): string => {
  return ctrlMsg.type + "::" + ctrlMsg.requestId + "::" + (ctrlMsg.data || "");
};
