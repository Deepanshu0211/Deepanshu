// Prints a SECRET_DOOR_MEMBERS entry for one member of the secret door in the study.
//   node scripts/member.mjs <name> <password>
// Join several entries with `;` and set the result as SECRET_DOOR_MEMBERS (in .env.local, and in Vercel).
import { randomBytes, scryptSync } from "node:crypto";

const [name, password] = process.argv.slice(2);
if (!name || !password || name.includes(":") || name.includes(";")) {
  console.error("Usage: node scripts/member.mjs <name> <password>   (the name cannot contain : or ;)");
  process.exit(1);
}
const salt = randomBytes(16);
console.log(`${name}:${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`);
