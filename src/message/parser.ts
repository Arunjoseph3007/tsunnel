import { ControllMsg } from "./types";

export const unmarshall = <T = string>(
  data: Buffer<ArrayBufferLike>
): Required<ControllMsg<T>> => {
  return JSON.parse(data.toString());
};

export const marshall = <T>(ctrlMsg: ControllMsg<T>): string => {
  return JSON.stringify(ctrlMsg);
};
