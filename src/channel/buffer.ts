const DELIMITER = 0;
const delimiterAsBuf = Uint8Array.from([DELIMITER]);
const ESCAPE_CHAR = 1;
const escapeAsBuf = Uint8Array.from([ESCAPE_CHAR]);

export const smartProcessData = (
  data: Buffer<ArrayBufferLike>,
  delimiter: number = DELIMITER,
  escape: number = ESCAPE_CHAR
): Buffer<ArrayBufferLike> => {
  let output = Buffer.from([]);

  for (const char of data) {
    if (char == delimiter || char == escape) {
      output = Buffer.concat([output, escapeAsBuf]);
    }
    output = Buffer.concat([output, Uint8Array.from([char])]);
  }
  output = Buffer.concat([output, delimiterAsBuf]);
  return output;
};

export const smartSplitData = (
  data: Buffer<ArrayBufferLike>,
  delimiter: number = DELIMITER,
  escape: number = ESCAPE_CHAR
): Array<Buffer<ArrayBufferLike>> => {
  let output: Buffer<ArrayBufferLike>[] = [];
  let segment = Buffer.from([]);
  let escaping = false;

  for (const char of data) {
    if (escaping) {
      segment = Buffer.concat([segment, Uint8Array.from([char])]);
      escaping = false;
    } else if (char == escape) {
      escaping = true;
    } else if (char == delimiter) {
      output.push(segment);
      segment = Buffer.from([]);
    } else {
      segment = Buffer.concat([segment, Uint8Array.from([char])]);
    }
  }

  output.push(segment);

  return output;
};
