import { z } from "zod";
import { hashPassword } from "../../utils";

interface Env {
	DB: D1Database;
}

const bodySchema = z.object({
	username: z
		.string()
		.min(3)
		.max(30)
		.regex(/^[a-zA-Z0-9_]+$/),
	email: z.string().email().max(255),
	password: z
		.string()
		.min(8)
		.max(50)
		.regex(/^[a-zA-Z0-9!@#$%^&*]*$/),
});

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
	// // Transforming ReadableStream<Uint8Array> into JSON string
	// // All of this is eventually useless since "ctx.request.json()" achieve the same result
	// const bodyReader = ctx.request.body.getReader();
	// const bodyDecoder = new TextDecoder("utf-8");
	// const bodyBuffer = (await bodyReader.read()).value as Uint8Array;
	// const bodyString = bodyDecoder.decode(bodyBuffer);
	try {
		// Get the body of the request as JSON object
		const body = await ctx.request.json();

		// Validating JSON object against schema
		const data = bodySchema.parse(body);

		// Hashing the password
		const hashedPassword = await hashPassword(data.password);

		const user = await ctx.env.DB.prepare(
			"SELECT username FROM users WHERE username = ?1",
		)
			.bind(data.username)
			.first<{ username: string }>();

		if (user) {
			return Response.json(
				{ message: "Username already exists" },
				{ status: 409 },
			);
		}
		const email = await ctx.env.DB.prepare(
			"SELECT email FROM users WHERE email = ?1",
		)
			.bind(data.email)
			.first<{ email: string }>();

		if (email) {
			return Response.json(
				{ message: "Email already exists" },
				{ status: 409 },
			);
		}

		// Inserting data into the database
		await ctx.env.DB.prepare(
			"INSERT INTO users (id, username, password_hash, email) VALUES (?1, ?2, ?3, ?4);",
		)
			.bind(crypto.randomUUID(), data.username, hashedPassword, data.email)
			.run();

		return Response.json({ message: "User account created" }, { status: 201 });
	} catch (e) {
		if (e instanceof SyntaxError) {
			return Response.json(
				{ name: e.name, message: e.message },
				{ status: 422 },
			);
		}
		if (e instanceof z.ZodError) {
			return Response.json(
				{ name: e.name, message: e.message },
				{ status: 422 },
			);
		}
		return Response.json({ name: e.name, message: e.message }, { status: 500 });
	}
};
