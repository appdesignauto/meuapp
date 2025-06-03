import crypto from "crypto";
import util from "util";

const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  const hash = `${buf.toString("hex")}.${salt}`;
  return hash;
}

async function main() {
  const password = "designauto@123";
  const hash = await hashPassword(password);
  console.log(`Hash da senha "${password}":`);
  console.log(hash);
}

main();
