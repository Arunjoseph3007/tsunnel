// IMP: This entire module might be replaced by an actual module like ip (https://www.npmjs.com/package/ip)
// This is just my attempt to restrict external dependencies

/**
 * Checks is the given string is valid IPv4 cidr block
 * Not a perfect function as it returns true for values like 956.0.0.1/8
 * @param cidr
 */
export const isValidCidr = (cidr: string): boolean => {
  const ipv4CidrRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}\/([0-9]{1,2})$/;

  return ipv4CidrRegex.test(cidr);
};

export const isValidIP = (cidr: string): boolean => {
  const ipv4Regex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;

  return ipv4Regex.test(cidr);
};

export const toNumber = (ip: string) => {
  return ip
    .split(".")
    .map(Number)
    .reduce((prev, curr) => prev * 256 + curr, 0);
};

export const toString = (ipNum: number) => {
  const frags: number[] = [];

  for (let i = 0; i < 4; i++) {
    const frag = ipNum % 256;
    frags.push(frag);
    ipNum = Math.floor(ipNum / 256);
  }

  return frags.map(String).join(".");
};

export const subnetContains = (ip: string, cidr: string): boolean => {
  const [cidrIp, mask] = cidr.split("/");

  const lowest = toNumber(cidrIp);
  const highest = lowest + 2 ** (32 - Number(mask));

  const ipNum = toNumber(ip);

  return ipNum >= lowest && ipNum <= highest;
};
