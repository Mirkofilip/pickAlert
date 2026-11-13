import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const required = [
  "android/app/google-services.json",
  "android/keystore.properties",
];
for (const file of required) {
  if (!existsSync(file)) {
    console.error(
      `Manca ${file}. Segui ANDROID_RELEASE.md prima di creare il rilascio.`,
    );
    process.exit(1);
  }
}
const firebase = JSON.parse(readFileSync(required[0], "utf8"));
const config = JSON.parse(readFileSync("capacitor.config.json", "utf8"));
if (
  !firebase.client?.some(
    (c) => c.client_info?.android_client_info?.package_name === config.appId,
  )
) {
  console.error("Il package Firebase non corrisponde ad appId.");
  process.exit(1);
}
const props = readFileSync(required[1], "utf8");
for (const key of ["storeFile", "storePassword", "keyAlias", "keyPassword"])
  if (!new RegExp(`^${key}=.+$`, "m").test(props)) {
    console.error(`Manca ${key} in keystore.properties`);
    process.exit(1);
  }
const result = spawnSync(
  "./gradlew",
  [process.argv[2] === "apk" ? "assembleRelease" : "bundleRelease"],
  { cwd: "android", stdio: "inherit" },
);
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
