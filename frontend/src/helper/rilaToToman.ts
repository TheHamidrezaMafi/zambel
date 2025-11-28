export const ConvertRialToToman = (value: number | string) => {
  const val = Number(value);
  if (val === 0) return val;
  return Math.floor(val / 10)?.toLocaleString();
};
