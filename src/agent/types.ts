export type TCPAgentOptions = {
  localPort: number;
  localHost: string;
  allow?: string[];
  deny?: string[];
};

export type TCPTunnelOptions = Omit<TCPAgentOptions, "localPort" | "localHost">;

export type HTTPAgentOptions = {
  localPort: number;
  localHost: string;
  allow?: string[];
  deny?: string[];
  basicAuth?: string[];
  reqHeadersAdd?: string[];
  reqHeadersRm?: string[];
  resHeadersAdd?: string[];
  resHeadersRm?: string[];
};

export type HTTPTunnelOptions = Omit<
  HTTPAgentOptions,
  "localPort" | "localHost"
>;

export type FileAgentOptions = {
  directory: string;
  allow?: string[];
  deny?: string[];
};
