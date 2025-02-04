import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import {
  FileAgentOptions,
  HTTPAgentOptions,
  TCPAgentOptions,
} from "../agent/types";

export enum MsgType {
  Start = 100, // Marks start of a request
  Data = 101, // for data transfer
  End = 102, // Marks end of a request
  Metadata = 103, // For sending headers
  Error = 104, // Unhandled error
  ReqTunnel = 105, // For requesting tunnel
  TunnelGranted = 106, // For granting tunnel
}

export type ControllMsg = {
  type: MsgType;
  requestId: string;
  data: Buffer<ArrayBufferLike>;
};

export type ReqTunnelMsg =
  | TCPAgentOptions
  | HTTPAgentOptions
  | FileAgentOptions;

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
    data: Buffer.alloc(0),
  };
};

export const makeEndMsg = (requestId: string): ControllMsg => {
  return {
    type: MsgType.End,
    requestId,
    data: Buffer.alloc(0),
  };
};

export const makeDataMsg = (
  requestId: string,
  data: Buffer<ArrayBufferLike>
): ControllMsg => {
  return {
    type: MsgType.Data,
    requestId,
    data: data,
  };
};

export const makeMetaDataMsg = (
  requestId: string,
  data: Buffer<ArrayBufferLike>
): ControllMsg => {
  return {
    requestId,
    type: MsgType.Metadata,
    data: data,
  };
};

export type HTTPServerResponse = ServerResponse<IncomingMessage> & {
  req: IncomingMessage;
};
