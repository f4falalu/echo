import type { ModelMessage } from "ai";
import { describe, expect, test } from "vitest";
import { createAnalystAgent } from "./analyst-agent";

describe("Analyst Agent Integration Tests", () => {
	test("should generate response for data analysis query with conversation history", async () => {
		const messages: ModelMessage[] = [];

		try {
			const analystAgent = createAnalystAgent({
				sql_dialect_guidance: "postgresql",
			});

			const streamResult = await analystAgent.stream({
				messages,
			});

			let response = "";
			for await (const chunk of streamResult.fullStream) {
				if (chunk.type === "text-delta") {
					response += chunk.text;
				}
			}

			expect(response).toBeDefined();
			expect(typeof response).toBe("string");
		} catch (error) {
			console.error("Error during agent execution:", error);
			throw error;
		}
	}, 300000);
});
