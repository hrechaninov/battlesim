import {Fleet} from "./ship.js";

export function mockFleets(){
	const fleets = [];
	fleets.push(Fleet.generateFleet({
		corvettes: 15,
		destroyers: 10,
		cruisers: 8,
		battleships: 3,
		titans: 0,
		name: "Fleet One",
		color: "blue",
		side: {
			name: "Side One",
			id: "sideOneId"
		},
		id: "1"
	}));
	fleets.push(Fleet.generateFleet({
		corvettes: 15,
		destroyers: 10,
		cruisers: 8,
		battleships: 3,
		name: "Fleet Two",
		color: "red",
		side: {
			name: "Side Two",
			id: "sideTwoId"
		},
		id: "2"
	}));
	return fleets;
}