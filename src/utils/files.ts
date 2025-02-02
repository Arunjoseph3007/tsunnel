import path from "path";

const extensionToContentType: Record<string, string> = {
  // Text-based files
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  csv: "text/csv",
  js: "text/javascript",
  mjs: "text/javascript",
  json: "application/json",
  xml: "application/xml",
  txt: "text/plain",
  md: "text/markdown",
  ts: "application/typescript",

  // Images
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  webp: "image/webp",
  ico: "image/x-icon",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",

  // Audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  aac: "audio/aac",
  flac: "audio/flac",
  m4a: "audio/mp4",

  // Video
  mp4: "video/mp4",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  wmv: "video/x-ms-wmv",
  flv: "video/x-flv",
  mkv: "video/x-matroska",
  webm: "video/webm",

  // Fonts
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  eot: "application/vnd.ms-fontobject",

  // Documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Archives & Compressed Files
  zip: "application/zip",
  rar: "application/vnd.rar",
  tar: "application/x-tar",
  gz: "application/gzip",
  "7z": "application/x-7z-compressed",

  // Executables & Binary
  exe: "application/vnd.microsoft.portable-executable",
  bin: "application/octet-stream",
  dll: "application/octet-stream",
  iso: "application/x-iso9660-image",
  dmg: "application/x-apple-diskimage",

  // Other
  wasm: "application/wasm",
};

export const getContentType = (file: string): string => {
  const extension = path.extname(file).slice(1);

  const contentType =
    extensionToContentType[extension] || "application/octet-stream";

  return contentType;
};
