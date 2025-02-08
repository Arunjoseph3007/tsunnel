import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import {
  FileAgentOptions,
  HTTPAgentOptions,
  TCPAgentOptions,
} from "../agent/types";
import { HeaderLength } from "../channel/buffer";

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
  version: number;
  type: MsgType;
  length: number;
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
    version: 1,
    type: MsgType.Start,
    requestId,
    data: Buffer.alloc(0),
    length: HeaderLength,
  };
};

export const makeEndMsg = (requestId: string): ControllMsg => {
  return {
    version: 1,
    type: MsgType.End,
    requestId,
    data: Buffer.alloc(0),
    length: HeaderLength,
  };
};

export const makeDataMsg = (
  requestId: string,
  data: Buffer<ArrayBufferLike>
): ControllMsg => {
  return {
    version: 1,
    type: MsgType.Data,
    requestId,
    data: data,
    length: data.length + HeaderLength,
  };
};

export const makeMetaDataMsg = (
  requestId: string,
  data: Buffer<ArrayBufferLike>
): ControllMsg => {
  return {
    version: 1,
    requestId,
    type: MsgType.Metadata,
    data: data,
    length: data.length + HeaderLength,
  };
};

export const makeErrorMsg = (
  requestId: string,
  errMsg: string
): ControllMsg => {
  return {
    version: 1,
    requestId,
    type: MsgType.Error,
    data: Buffer.from(errMsg),
    length: HeaderLength + errMsg.length,
  };
};

export const makeReqTunnelMsg = (data: ReqTunnelMsg): ControllMsg => {
  const dataString = JSON.stringify(data);
  return {
    version: 1,
    requestId: "",
    length: HeaderLength + dataString.length,
    type: MsgType.ReqTunnel,
    data: Buffer.from(dataString),
  };
};

export const makeTunnelGrantMsg = (
  data: ReqTunnelMsg,
  uri: string
): ControllMsg => {
  const dataString = JSON.stringify({ ...data, uri });

  return {
    version: 1,
    requestId: "",
    length: HeaderLength + dataString.length,
    type: MsgType.TunnelGranted,
    data: Buffer.from(dataString),
  };
};

export type HTTPServerResponse = ServerResponse<IncomingMessage> & {
  req: IncomingMessage;
};
