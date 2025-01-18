import { HTTPReqMetadata, HTTPResMetadata } from "./types";
import { IncomingMessage } from "http";

export const marshallReqHeaders = (req: IncomingMessage): string => {
  return JSON.stringify({
    url: req.url,
    method: req.method,
    headers: req.headers,
  });
};

export const unmarshallReqHeaders = (data: string): HTTPReqMetadata => {
  return JSON.parse(data);
};

export const marshallRespHeaders = (res: IncomingMessage): string => {
  return JSON.stringify({
    statusCode: res.statusCode,
    headers: res.headers,
  });
};

export const unmarshallRespHeaders = (data: string): HTTPResMetadata => {
  return JSON.parse(data);
};
