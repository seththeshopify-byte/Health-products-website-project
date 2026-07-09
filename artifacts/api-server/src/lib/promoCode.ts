const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generatePromoCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
