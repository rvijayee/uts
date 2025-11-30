// placeholder
import * as crypto from "crypto";
import * as fs from "fs";

export function computeFileChecksum(filePath: string) {
    const file = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(file).digest("hex");
}

export function computeProjectChecksum(list: string[]) {
    return crypto
        .createHash("sha256")
        .update(list.join("|"))
        .digest("hex");
}
