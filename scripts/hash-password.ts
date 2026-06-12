// Giriş şifresi için bcrypt özeti üretir.
// Kullanım: npm run auth:hash -- 'şifreniz'
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error("Kullanım: npm run auth:hash -- 'şifreniz'  (en az 8 karakter)");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log("\nAUTH_PASSWORD_HASH olarak .env dosyasına ekleyin:\n");
console.log(hash);
console.log("\nNot: Vercel'e eklerken değeri tırnak içine almayın.");
