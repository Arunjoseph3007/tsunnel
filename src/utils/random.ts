import * as crypto from "crypto";

export const string = (): string => {
  return crypto.randomUUID();
};

export const stringOfLen = (len: number): string => {
  return crypto.randomBytes(len).toString("hex").slice(len);
};

export const shortString = (): string => {
  return stringOfLen(8);
};

export const longString = (): string => {
  return stringOfLen(32);
};
