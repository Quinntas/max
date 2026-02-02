export interface Vehicle {
	vin: string;
	make: string;
	model: string;
	year: number;
	trim?: string;
	price?: number;
	mileage?: number;
	exteriorColor?: string;
	interiorColor?: string;
	status: "AVAILABLE" | "PENDING" | "SOLD";
	imageUrl?: string;
}

export interface VehicleQuery {
	make?: string;
	model?: string;
	year?: number;
	maxPrice?: number;
	maxMileage?: number;
}

export interface InventoryAdapter {
	search(query: VehicleQuery): Promise<Vehicle[]>;
	getByVin(vin: string): Promise<Vehicle | null>;
}
