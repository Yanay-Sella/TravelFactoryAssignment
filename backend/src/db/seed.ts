import { loadEnv } from "commoneventframework";
import bcrypt from "bcryptjs";
import { getDataSource } from "./dataSource";
import { User, UserRole } from "../entities/User";

const DEMO_PASSWORD = "password123";

const DEMO_USERS = [
	{ name: "Alice Martin", email: "alice@travelfactory.test", role: UserRole.Requester },
	{ name: "Bruno Lefevre", email: "bruno@travelfactory.test", role: UserRole.Requester },
	{ name: "Claire Dubois", email: "claire@travelfactory.test", role: UserRole.Validator },
];

// Idempotent: existing users are left untouched so the seed can be re-run safely.
const seed = async () => {
	await loadEnv();

	const dataSource = await getDataSource();
	const users = dataSource.getRepository(User);
	const password = await bcrypt.hash(DEMO_PASSWORD, 10);

	for (const demoUser of DEMO_USERS) {
		if (await users.findOneBy({ email: demoUser.email })) {
			console.log(`skipped (already exists): ${demoUser.email}`);
			continue;
		}

		await users.save(users.create({ ...demoUser, password }));
		console.log(`created ${demoUser.role}: ${demoUser.email}`);
	}

	await dataSource.destroy();
	console.log(`\nDemo password for every seeded user: ${DEMO_PASSWORD}`);
};

seed().catch((error) => {
	console.error("seed failed", error);
	process.exit(1);
});
