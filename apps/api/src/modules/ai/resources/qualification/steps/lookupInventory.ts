import { createStep } from "@mastra/core/workflows";
import z from "zod";
import { BasicInventoryAdapter } from "../../../../inventory/providers/basic.adapter";

const inventoryAdapter = new BasicInventoryAdapter("");

export const lookupInventoryStep = createStep({
	id: "lookup-inventory",
	description: "Check vehicle inventory based on interest",
	inputSchema: z.object({
		vehicleInterest: z
			.object({
				make: z.string().nullable(),
				model: z.string().nullable(),
				year: z.number().nullable(),
			})
			.nullable(),
	}),
	outputSchema: z.object({
		inventoryContext: z.string(),
		foundVehicles: z.array(z.any()),
	}),
	execute: async ({ inputData }) => {
		const interest = inputData.vehicleInterest;

		if (!interest || (!interest.make && !interest.model)) {
			return {
				inventoryContext: "No specific vehicle interest identified yet.",
				foundVehicles: [],
			};
		}

		const vehicles = await inventoryAdapter.search({
			make: interest.make || undefined,
			model: interest.model || undefined,
			year: interest.year || undefined,
		});

		if (vehicles.length === 0) {
			return {
				inventoryContext: `Checked inventory: No vehicles found matching ${interest.year || ""} ${interest.make || ""} ${interest.model || ""}.`,
				foundVehicles: [],
			};
		}

		const vehicleList = vehicles
			.slice(0, 3) // Limit to 3
			.map(
				(v) =>
					`- ${v.year} ${v.make} ${v.model} (${v.trim || "Base"}), ${v.mileage}mi, $${v.price}`,
			)
			.join("\n");

		return {
			inventoryContext: `Available Inventory Matches:\n${vehicleList}`,
			foundVehicles: vehicles,
		};
	},
});
