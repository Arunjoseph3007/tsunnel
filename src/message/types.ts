export enum MsgType {
  Start = "Start",
  Data = "Data",
  End = "End",
}

export type ControllMsg = {
  type: MsgType;
  requestId: string;
  data?: string;
};

export const makeStartMsg = (requestId: string): ControllMsg => {
  return {
    type: MsgType.Start,
    requestId,
  };
};

export const makeEndMsg = (requestId: string): ControllMsg => {
  return {
    type: MsgType.End,
    requestId,
  };
};

export const makeDataMsg = (
  requestId: string,
  data: Buffer<ArrayBufferLike>
): ControllMsg => {
  return {
    type: MsgType.Data,
    requestId,
    data: data.toString(),
  };
};
