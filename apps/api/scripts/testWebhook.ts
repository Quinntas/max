const WEBHOOK_URL = "http://localhost:5000/webhooks/twilio/sms";
const DEALERSHIP_PHONE = "+15551234567";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendWebhook(name: string, payload: any) {
    console.log(`\n--------------------------------------------------`);
    console.log(`📡 Sending [${name}]...`);

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Twilio-Signature": "mock-signature",
            },
            body: JSON.stringify(payload),
        });

        const text = await response.text();
        console.log(`✅ Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            console.log(`📄 Error Response: ${text}`);
        } else if (text && text.length < 200) {
            console.log(`📄 Response: ${text}`);
        } else if (text) {
            console.log(`📄 Response: (XML/Text content received)`);
        }
    } catch (error) {
        console.error(`❌ Error sending request:`, error);
    }
}

async function runTests() {
    console.log("🚀 Starting Webhook Functionality Tests for Dealership AI Agent...");
    console.log(`Target: ${WEBHOOK_URL}`);
    console.log(`Dealership Phone: ${DEALERSHIP_PHONE}`);

    // ==========================================
    // Scenario 1: Happy Path - Qualification Flow
    // ==========================================
    // This flow simulates a user going from initial interest to providing details.
    // Tests: extractContactInfoStep, scoreQualificationStep, generateResponseStep
    // Contact: id=1, email=test4@gmail.com
    const happyPathUser = "+5596999999991";

    console.log("\n🔹 Scenario 1: Happy Path (Qualification)");

    await sendWebhook("1.1 Initial Interest", {
        To: DEALERSHIP_PHONE,
        From: happyPathUser,
        Body: "Hi, I'm interested in the Toyota Camry I saw on your site.",
        MessageSid: "SM_HP_1",
        AccountSid: "AC_TEST"
    });

    await sleep(3000); // Wait for async processing & simulation of user reading

    await sendWebhook("1.2 Timeline", {
        To: DEALERSHIP_PHONE,
        From: happyPathUser,
        Body: "I'm looking to buy in the next 7 days.",
        MessageSid: "SM_HP_2",
        AccountSid: "AC_TEST"
    });

    await sleep(3000);

    await sendWebhook("1.3 Trade-In Details", {
        To: DEALERSHIP_PHONE,
        From: happyPathUser,
        Body: "Yes, I have a 2018 Honda Civic to trade in. It has 45k miles.",
        MessageSid: "SM_HP_3",
        AccountSid: "AC_TEST"
    });

    // ==========================================
    // Scenario 2: Escalation
    // ==========================================
    // Tests: checkEscalationStep -> triggers escalation
    // Contact: id=2, email=test3@gmail.com
    const escalatedUser = "+5596999999992";

    console.log("\n🔹 Scenario 2: Escalation Request");
    await sleep(2000);

    await sendWebhook("2.1 Escalation Request", {
        To: DEALERSHIP_PHONE,
        From: escalatedUser,
        Body: "I need to speak to a manager right now about my service appointment. This is urgent.",
        MessageSid: "SM_ESC_1",
        AccountSid: "AC_TEST"
    });

    // ==========================================
    // Scenario 3: Opt-Out / Compliance
    // ==========================================
    // Tests: checkComplianceStep
    // Contact: id=3, email=test5@gmail.com
    const optOutUser = "+5596999999993";

    console.log("\n🔹 Scenario 3: Compliance (Opt-Out)");
    await sleep(2000);

    await sendWebhook("3.1 Opt-Out (STOP)", {
        To: DEALERSHIP_PHONE,
        From: optOutUser,
        Body: "STOP",
        MessageSid: "SM_STOP_1",
        AccountSid: "AC_TEST"
    });

    // ==========================================
    // Scenario 4: Inventory Query
    // ==========================================
    // Tests: lookupInventoryStep
    // Contact: id=4, email=test1@gmail.com
    const inventoryUser = "+5596999999994";

    console.log("\n🔹 Scenario 4: Inventory Query");
    await sleep(2000);

    await sendWebhook("4.1 Specific Inventory Check", {
        To: DEALERSHIP_PHONE,
        From: inventoryUser,
        Body: "Do you have any 2024 RAV4 Hybrids in stock right now?",
        MessageSid: "SM_INV_1",
        AccountSid: "AC_TEST"
    });

    console.log("\n✨ All Tests Completed.");
}

runTests();
