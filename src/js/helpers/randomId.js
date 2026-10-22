const idPrefix = [1e7] + -1e3 + -4e3 + -8e3 + -1e11;

const generateRandomByte = () => {
  const byteBuffer = new Uint8Array(1);

  return crypto.getRandomValues(byteBuffer)[0];
};

const generateByteValue = (match) => {
  const randomByte = generateRandomByte();
  const byteValue = match ^ (randomByte & (15 >> (match / 4)));

  return byteValue.toString(16);
};

/**
 * UUID v4.
 * crypto.randomUUID есть во всех современных браузерах, но только на https/localhost,
 * поэтому оставлен запасной вариант.
 */
export const uuIdV4 = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : idPrefix.replace(/[018]/g, generateByteValue);
