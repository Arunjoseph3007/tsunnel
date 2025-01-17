import { HTTPMetadata } from "./types";
import { IncomingMessage } from "http";

export const marshallReqHeaders = (req: IncomingMessage): string => {
  return JSON.stringify({
    url: req.url,
    method: req.method,
    headers: req.headers,
  });
};

export const unmarshallReqHeaders = (data: string): HTTPMetadata => {
  return JSON.parse(data);
};
