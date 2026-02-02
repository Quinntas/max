import { logger } from "../../../start/logger";
import type { InventoryAdapter, Vehicle, VehicleQuery } from "../core/inventory.adapter";

export class BasicInventoryAdapter implements InventoryAdapter {
	private apiUrl: string;

	constructor(apiUrl: string) {
		this.apiUrl = apiUrl;
	}

	async search(query: VehicleQuery): Promise<Vehicle[]> {
		logger.info({ query }, "Searching inventory (Basic Adapter)");

		try {
			if (!this.apiUrl) {
				return this.getMockVehicles(query);
			}

			const params = new URLSearchParams();
			if (query.make) params.append("make", query.make);
			if (query.model) params.append("model", query.model);
			if (query.year) params.append("year", query.year.toString());

			const response = await fetch(`${this.apiUrl}/vehicles?${params.toString()}`);
			if (!response.ok) {
				throw new Error(`Inventory API error: ${response.statusText}`);
			}

			const data = (await response.json()) as Vehicle[];
			return data;
		} catch (error) {
			logger.error({ error }, "Error searching inventory");
			return [];
		}
	}

	async getByVin(vin: string): Promise<Vehicle | null> {
		logger.info({ vin }, "Getting vehicle by VIN (Basic Adapter)");

		try {
			if (!this.apiUrl) {
				const mock = this.getMockVehicles({}).find((v) => v.vin === vin);
				return mock || null;
			}

			const response = await fetch(`${this.apiUrl}/vehicles/${vin}`);
			if (!response.ok) {
				if (response.status === 404) return null;
				throw new Error(`Inventory API error: ${response.statusText}`);
			}

			const data = (await response.json()) as Vehicle;
			return data;
		} catch (error) {
			logger.error({ error }, "Error getting vehicle by VIN");
			return null;
		}
	}

	private getMockVehicles(query: VehicleQuery): Vehicle[] {
		const allVehicles: Vehicle[] = [
			{
				vin: "1234567890ABCDEFG",
				make: "Toyota",
				model: "Camry",
				year: 2023,
				trim: "SE",
				price: 28000,
				mileage: 5000,
				status: "AVAILABLE",
				exteriorColor: "Silver",
			},
			{
				vin: "0987654321GFEDCBA",
				make: "Honda",
				model: "Civic",
				year: 2024,
				trim: "Sport",
				price: 26500,
				mileage: 1200,
				status: "AVAILABLE",
				exteriorColor: "Black",
			},
			{
				vin: "ABC123XYZ78900000",
				make: "Ford",
				model: "F-150",
				year: 2022,
				trim: "XLT",
				price: 45000,
				mileage: 30000,
				status: "PENDING",
				exteriorColor: "Blue",
			},
		];

		return allVehicles.filter((v) => {
			if (query.make && v.make.toLowerCase() !== query.make.toLowerCase()) return false;
			if (query.model && v.model.toLowerCase() !== query.model.toLowerCase()) return false;
			if (query.year && v.year !== query.year) return false;
			if (query.maxPrice && (v.price || 0) > query.maxPrice) return false;
			return true;
		});
	}
}
