export const validHeaderFormat = (key_value: string) => {
  return /^[a-zA-Z-]+:.+$/.test(key_value);
};
