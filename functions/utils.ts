/* 
This can further be improved further by modifying providedSalt
to accept a string instead of a Uint8Array (maybe?).
*/

// Password hashing function
// It returns a hex string of length 97
export async function hashPassword(
	password: string,
	providedSalt?: Uint8Array,
): Promise<string> {
	const encoder = new TextEncoder();
	// Use provided salt if available, otherwise generate a new one
	const salt = providedSalt || crypto.getRandomValues(new Uint8Array(16));
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		{ name: "PBKDF2" },
		false,
		["deriveBits", "deriveKey"],
	);
	const key = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt,
			iterations: 100, // 100000 is the maximum number of iterations
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt", "decrypt"],
	);
	const exportedKey = (await crypto.subtle.exportKey(
		"raw",
		key,
	)) as ArrayBuffer;
	const hashBuffer = new Uint8Array(exportedKey);
	const hashArray = Array.from(hashBuffer);
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	const saltHex = Array.from(salt)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `${saltHex}:${hashHex}`;
}

// Verify password function
export async function verifyPassword(
	storedHash: string,
	passwordAttempt: string,
): Promise<boolean> {
	const [saltHex, originalHash] = storedHash.split(":");
	const matchResult = saltHex.match(/.{1,2}/g);
	if (!matchResult) {
		throw new Error("Invalid salt format");
	}
	const salt = new Uint8Array(
		matchResult.map((byte) => Number.parseInt(byte, 16)),
	);
	const attemptHashWithSalt = await hashPassword(passwordAttempt, salt);
	const [, attemptHash] = attemptHashWithSalt.split(":");
	return attemptHash === originalHash;
}
