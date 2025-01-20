import { IncomingHttpHeaders } from "http";

export enum MsgType {
  Start = "Start", // Marks start of a request
  Data = "Data", // for data transfer
  End = "End", // Marks end of a request
  Metadata = "Metadata", // For sending headers
  Error = "Error", // Unhandled error
  Status = "Status", // Transfer tsunnel related data
}

export enum StatusMsgType {
  Success = "Success",
  Failure = "Failure",
}

export type ControllMsg = {
  type: MsgType;
  requestId: string;
  data?: string;
};

export type HTTPReqMetadata = {
  url: string;
  method: string;
  headers: IncomingHttpHeaders;
};

export type HTTPResMetadata = {
  statusCode: number;
  headers: IncomingHttpHeaders;
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

export const makeMetaDataMsg = (
  requestId: string,
  data: Buffer<ArrayBufferLike>
): ControllMsg => {
  return {
    requestId,
    type: MsgType.Metadata,
    data: data.toString(),
  };
};
