import { HTTPReqMetadata, HTTPResMetadata } from "./types";
import { IncomingMessage } from "http";

export const marshallReqHeaders = (req: IncomingMessage): HTTPReqMetadata => {
  return {
    url: req.url || "",
    method: req.method || "GET",
    headers: req.headers,
  };
};

export const unmarshallReqHeaders = (data: string): HTTPReqMetadata => {
  return JSON.parse(data);
};

export const marshallRespHeaders = (res: IncomingMessage): HTTPResMetadata => {
  return {
    statusCode: res.statusCode || 500,
    headers: res.headers,
  };
};

export const unmarshallRespHeaders = (data: string): HTTPResMetadata => {
  return JSON.parse(data);
};
