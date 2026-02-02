import { rebaseContactsCommand } from "../src/modules/hubspot/resources/rebaseContacts";

const USER_ID = "NyY3sMqEMrypKDU43vpCUEhlMuVk8jAd";

async function runRebase() {
	console.log("🚀 Starting HubSpot Contact Rebase...");
	console.log(`User ID: ${USER_ID}`);
	console.log("--------------------------------------------------\n");

	try {
		console.log("📡 Fetching contacts from HubSpot and syncing to database...");

		await rebaseContactsCommand.handle({
			userId: USER_ID,
		});

		console.log("\n✅ HubSpot contact rebase completed successfully!");
	} catch (error) {
		console.error("\n❌ Error during rebase:", error);
		process.exit(1);
	}
}

runRebase();
