const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const chrono = require("chrono-node");

async function runTests() {
    console.log("🔍 Running PRD Refinements verification tests...");

    // Test 1: chrono-node date parsing
    const textDates = ["24 July", "next Friday", "31/07/2026", "tomorrow at 5pm", "yesterday"];
    console.log("\n--- TEST 1: Date Parsing with chrono-node ---");
    for (const text of textDates) {
        const parsed = chrono.parseDate(text);
        console.log(`Parsed "${text}":`, parsed ? parsed.toLocaleString("en-NG") : "FAILED");
    }

    // Test 2: Priority inference rule
    console.log("\n--- TEST 2: Task Priority Inference Fallback ---");
    const testTasks = [
        { desc: "Pay salaries to developers", expected: "high" },
        { desc: "Pay the rent for office", expected: "high" },
        { desc: "Call Sarah about outstanding invoice #1004", expected: "high" },
        { desc: "Buy milk and groceries", expected: "low" },
        { desc: "Pick up the laundry parcel", expected: "low" },
        { desc: "Draft a response about project deliverables", expected: "normal" }
    ];
    
    const resolvePriority = (taskDescription) => {
        const descLower = String(taskDescription).toLowerCase();
        if (/rent|salary|salaries|invoice|pay|loan|fee|bill|tax|settle|debt|owe|client|customer|contract/i.test(descLower)) {
            return "high";
        } else if (/milk|grocery|groceries|parcel|package|errand|shop|store|buy|laundry|clean|barber/i.test(descLower)) {
            return "low";
        } else {
            return "normal";
        }
    };

    for (const task of testTasks) {
        const res = resolvePriority(task.desc);
        console.log(`Task: "${task.desc}" => Inferred: ${res} (Expected: ${task.expected}) - ${res === task.expected ? "✅ MATCH" : "❌ MISMATCH"}`);
    }

    console.log("\n🎉 Verification tests run complete.");
    process.exit(0);
}

runTests();
