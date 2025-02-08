const DELIMITER = "|";
const ESCAPE_CHAR = "~";

export const smartProcessData = (
  data: string,
  delimiter: string = DELIMITER,
  escape: string = ESCAPE_CHAR
): string => {
  let output = "";

  for (const char of data) {
    if (char == delimiter || char == escape) {
      output += escape;
    }
    output += char;
  }
  return output + delimiter;
};

export const smartSplitData = (
  data: string,
  delimiter: string = DELIMITER,
  escape: string = ESCAPE_CHAR
): string[] => {
  const output: string[] = [];
  let segment = "";
  let escaping = false;

  for (const char of data) {
    if (escaping) {
      segment += char;
      escaping = false;
    } else if (char == escape) {
      escaping = true;
    } else if (char == delimiter) {
      output.push(segment);
      segment = "";
    } else {
      segment += char;
    }
  }

  output.push(segment);

  return output;
};
