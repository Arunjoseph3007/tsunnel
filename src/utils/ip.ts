import * as ipUtils from "ip";

export const isValidCidr = (cidr: string): boolean => {
  const ipv4CidrRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}\/([0-9]{1,2})$/;

  return ipv4CidrRegex.test(cidr);
};

export const isValidIP = (cidr: string): boolean => {
  const ipv4Regex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;

  return ipv4Regex.test(cidr);
};

export const applyFilters = (
  ip?: string,
  allow?: string[],
  deny?: string[]
): boolean => {
  if (!ip) {
    return false;
  }

  if (ip.startsWith("::ffff:")) {
    ip = ip.slice("::ffff:".length);
  }

  if (deny) {
    for (const addr of deny) {
      if (ipUtils.cidrSubnet(addr).contains(ip)) {
        return false;
      }
    }
  }

  if (!allow || allow.length == 0) {
    return true;
  }

  for (const addr of allow) {
    if (ipUtils.cidrSubnet(addr).contains(ip)) {
      return true;
    }
  }

  return false;
};
