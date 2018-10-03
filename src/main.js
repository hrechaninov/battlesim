import {Ship, Fleet} from "./ship.js";
import Sprites from "./sprites.js";
import Game from "./game.js";
import {Event, Modifier} from "./event.js";
import Jomini from "jomini";

window.onload = loadPage;

async function loadPage(){
	let sprites = null;
	let canvas = document.querySelector("#fleet-canvas");
	let fleets = [];
	document
		.querySelector("#fleet-config-new-fleet-button")
		.addEventListener("click", e => { 
			addFleet(fleets, true);
		});
	document
		.querySelector("#fleet-config-tab-button-wrapper")
		.addEventListener("click", e => {
			const selectedFleet = document.querySelector(".selected");
			
			if(selectedFleet){
				let id = selectedFleet
					.getAttribute("id")
					.substring(13);
				deleteFleet(fleets, id);
			}
		});
	document.querySelectorAll("input").forEach(element => {
		element.addEventListener("input", e => {
			console.log("option changed");
			const selectedElem = document.querySelector(".selected");
			const isCustom = selectedElem.classList.contains("custom");
			const id = selectedElem.getAttribute("id").substring(13);
			updateFleet(id, fleets, isCustom);
		});
	});
	document.querySelectorAll("select").forEach(element => {
		element.addEventListener("input", e => {
			console.log("option changed");
			const selectedElem = document.querySelector(".selected");
			const isCustom = selectedElem.classList.contains("custom");
			const id = selectedElem.getAttribute("id").substring(13);
			updateFleet(id, fleets, isCustom);
		});
	});
	window.__fleets = fleets;
	
	
	sprites = await new Sprites().loadSprites();
	let fg = await startNewGame(fleets, canvas, sprites);
	fg.container = document.querySelector("#fleet-battle-screen");
	initEvents(fg);
	fg.events.startFleetSim.try(fg);
	await fg.toStart;
	gameLoop(fg);
	initBattleTab(fg);
	initBattleIndicators(fg);
	
	window.addEventListener("resize", function(){
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	});
	canvas.addEventListener("wheel", e => zoomView(e, fg));
	document.addEventListener("keydown", e => keyDown(e, fg));
	document.addEventListener("keyup", e => keyUp(e, fg));
	document
		.querySelector("#fleet-combat-tab-icon")
		.addEventListener("click", e => toggleBattleTab(e));
}
async function startNewGame(fleets, canvas, sprites){
	const fg = new Game(canvas);
	const debug = true;
	
	fg.canvas.width = window.innerWidth;
	fg.canvas.height = window.innerHeight;
	fg.sprites = sprites;

	if(debug){
		generateFleets(fg);
	}
	else{
		fleetsByTeams(fg, fleets);
	}
	initFleets(fg);

	return fg;
}
function initEvents(game){
	const lorem = "Events occur throughout the course of play. There are a whole range of events in the game, which can result in positive, negative and mixed outcomes for a player's empire. They take the form of a pop-up notification on the player's screen, which may present a player with a choice, or may simply inform the player of the consequences and require they acknowledge the event has occurred.";
	game.events.startFleetSim = new Event({
		name: "Start of simulation",
		descr: lorem
	});
	game.events.endFleetSim = new Event({
		name: "End of simulation",
		descr: lorem
	});

	game.events.startFleetSim.option = {
		name: "Start simulation",
		descr: "",
		callbacks: [
			(game => {
				game.start();
			}).bind(null, game)
		]
	};
	game.events.endFleetSim.option = {
		name: "Vae victus",
		descr: "",
		callbacks: [
			(game => {
				game.pause = true;
			}).bind(null, game)
		]
	};
	
}
function generateFleets(game){
	game.fleet = Fleet.generateFleet({
		corvettes: 20,
		destroyers: 10,
		cruisers: 5,
		name: "Republican fleet",
		faction: "republican",
		color: "blue"
	});
	game.fleet = Fleet.generateFleet({
		corvettes: 10,
		destroyers: 5,
		cruisers: 5,
		name: "Imperial fleet",
		faction: "imperial",
		color: "red"
	});
}
function fleetsByTeams(game, fleets){
	let teams = new Set(fleets.map(fleet => fleet.team));
	teams.forEach(team => {
		let teamFleets = fleets.filter(fleet => fleet.team === team);
		let newFleet = new Fleet(`${team} fleet`, team);
		console.log(teamFleets);
		teamFleets.forEach(fleet => fleet.ships.forEach(ship => newFleet.ship = ship));
		game.fleet = newFleet;
	});
}
function getFleets(){
	const fleetNodes = Array.from(document.querySelectorAll(".fleet-config-fleet"));
	const fleets = fleetNodes.map(node => new Fleet());
}
function addFleet(fleets, isCustom){
	const container = document.querySelector("#fleet-config-tab-fleets-container");
	const newFleet = new Fleet("Fleet name", "Faction name");
	const isCustomClass = isCustom ? "custom" : "";
	const tab = `
		<div class="fleet-config-fleet ${isCustomClass}" id="fleet-config-${newFleet.id}">
			<p class="fleet-config-fleet-name">Fleet name</p>
			<p class="fleet-config-fleet-team">Fleet side</p>
		</div>`;
	container.innerHTML += tab;
	document
		.querySelectorAll(".fleet-config-fleet")
		.forEach(el => {
			el.addEventListener("click", e => {
				selectFleetTab(e, fleets);
			});
		});
	document
		.querySelector("#fleet-config-new-fleet-button")
		.addEventListener("click", e => {
			addFleet(fleets, true);
		});
	fleets.push(newFleet);
}
function deleteFleet(fleets, id){
	const index = fleets.findIndex(fleet => fleet.id === id);
	const tab = document.querySelector(`#fleet-config-${id}`);

	if(tab){
		tab.remove();
	}
	fleets.splice(index, 1);
}
function updateFleet(id, fleets, isCustom){
	let currFleet = fleets.find(fleet => fleet.id === id);
	const tab = document.querySelector(`#fleet-config-${id}`);
	const nameTab = tab.querySelector(".fleet-config-fleet-name");
	const teamTab = tab.querySelector(".fleet-config-fleet-team");
	const newName = document.querySelector("#fleet-specs-name").value;
	const newFaction = document.querySelector("#fleet-specs-faction").value;
	const newTeam = document.querySelector("#fleet-specs-team").value;
	const normalisedFaction = normaliseInputValue(newFaction, "human");
	const normalisedTeam = normaliseInputValue(newTeam, "human");
	const corvettes = document
		.querySelector("#ships-specs-ship-tab-corvettes .ships-specs-ship-amount-val")
		.value;
	const destroyers = document
		.querySelector("#ships-specs-ship-tab-destroyers .ships-specs-ship-amount-val")
		.value;
	const cruisers = document
		.querySelector("#ships-specs-ship-tab-cruisers .ships-specs-ship-amount-val")
		.value;

	if(isCustom){
		let index = fleets.findIndex(fleet => fleet.id === id);
		currFleet = Fleet.generateFleet({
			corvettes: corvettes,
			destroyers: destroyers,
			cruisers: cruisers,
			name: newName,
			faction: normalisedFaction,
			team: normalisedTeam,
			color: "blue",
			id: currFleet.id
		});
		fleets[index] = currFleet;
	}
	else{
		currFleet.name = newName;
		currFleet.faction = normalisedFaction;
		currFleet.team = normalisedTeam;
	}
	if(newName.length && newName !== "placeholder"){
		nameTab.innerHTML = newName;
	}
	if(newTeam.length && newTeam !== "placeholder"){
		teamTab.innerHTML = normalisedTeam;
	}
}
function updateFleetInputs(id, fleets, isCustom){
	const currFleet = fleets.find(fleet => fleet.id === id);
	const reservedNames = [
		"Republican",
		"Imperial",
		"Pirates",
		"For State",
		"United Humanity",
		"Usurpers",
		"Triumvirate"
	];
	let nameInput = document.querySelector("#fleet-specs-name");
	let factionInput = document.querySelector("#fleet-specs-faction");
	let teamInput = document.querySelector("#fleet-specs-team");
	
	if(currFleet.name.length){
		nameInput.value = currFleet.name;
	}
	if(reservedNames.includes(currFleet.faction)){
		factionInput.value = normaliseInputValue(currFleet.faction, "machine");
	}
	else{
		factionInput.value = "placeholder";
	}
	if(currFleet.team && currFleet.team.length){
		teamInput.value = normaliseInputValue(currFleet.team, "machine");
	}
	else{
		teamInput.value = "placeholder";
	}

	if(isCustom){
		document.querySelector("#fleet-config-tab-ships-specs").classList.remove("hidden");
		document.querySelector("#ships-specs-ship-tab-corvettes").value = currFleet.corvettesAmount;
		document.querySelector("#ships-specs-ship-tab-destroyers").value = currFleet.destroyersAmount;
		document.querySelector("#ships-specs-ship-tab-cruisers").value = currFleet.cruisersAmount;
	}
	else{
		document.querySelector("#fleet-config-tab-ships-specs").classList.add("hidden");
	}
}
function selectFleetTab(e, fleets){
	console.log("select tab");
	const id = e.currentTarget.getAttribute("id").substring(13);
	const isCustom = e.currentTarget.classList.contains("custom");
	document.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));
	e.currentTarget.classList.add("selected");

	updateFleetInputs(id, fleets, isCustom);
}
function initFleets(game){
	game.fleets.forEach((fleet) => {
		fleet.calcLocalCoords();
	});
	Fleet.positionFleets(game.fleets);
	game.fleets.forEach(fleet => {
		game.ships = game.ships.concat(fleet.ships);
		fleet.localToGlobalCoords(game.canvas);
	});
	game.ships.forEach(ship => ship.defineEnemies(game.ships));
	console.log(game.ships);
}
function normaliseInputValue(inputValue, language){
	let values = {
		machine: [
			"fleet-specs-faction-republican",
			"fleet-specs-faction-imperial",
			"fleet-specs-faction-pirate",
			"fleet-specs-faction-forstate",
			"fleet-specs-faction-uh",
			"fleet-specs-team-usurpers",
			"fleet-specs-team-triumvirate"
		],
		human: [
			"Republican",
			"Imperial",
			"Pirates",
			"For State",
			"United Humanity",
			"Usurpers",
			"Triumvirate"
		]
	};
	if(language === "human"){
		let index = values.machine.indexOf(inputValue);
		return values.human[index];
	}
	if(language === "machine"){
		let index = values.human.indexOf(inputValue);
		return values.machine[index];
	}
	return "";
}
function drawShips(game){	
	game.ships.forEach(ship => ship.draw(game.ctx, game.sprites));
}
function draw(game, {scale: scale, translateX: translateX, translateY: translateY}){
	game.ctx.clearRect(0, 0, game.ctx.canvas.width, game.ctx.canvas.height);
	game.ctx.translate(translateX, translateY);
	game.ctx.scale(scale, scale);

	drawShips(game);

	game.ctx.scale(1/scale, 1/scale);
	game.ctx.translate(-translateX, -translateY);
}
function calculate(game){
	game.ships.forEach(ship => ship.think(game));
}
function zoomView(e, game){
	const speed = 1/1000;
	const newScale = game.options.scale + speed * -e.deltaY;
	let tension = 2.5;
	let dx = game.options.translateX - e.clientX;
	let dy = game.options.translateY - e.clientY;

	e.preventDefault();
	if(newScale >= 10){
		return;
	}
	else if(newScale <= 0.6){
		return;
	}
	else{
		game.options.scale = newScale;
		if(newScale > 1){
			tension *= (newScale * 2);
		}
		if(e.deltaY < 0){
			game.options.translateX += dx/tension;
			game.options.translateY += dy/tension;
		}
		else{
			game.options.translateX -= dx/tension;
			game.options.translateY -= dy/tension;
		}
	}
}
function keyUp(e, game){
	if(e.key === "w"){
		game.keyMap.up = false;
	}
	else if(e.key === "s"){
		game.keyMap.down = false;
	}
	if(e.key === "a"){
		game.keyMap.left = false;
	}
	else if(e.key === "d"){
		game.keyMap.right = false;
	}
	moveView(game);
}
function keyDown(e, game){
	if(e.key === "w"){
		game.keyMap.up = true;
	}
	else if(e.key === "s"){
		game.keyMap.down = true;
	}
	if(e.key === "a"){
		game.keyMap.left = true;
	}
	else if(e.key === "d"){
		game.keyMap.right = true;
	}
	if(e.key === " "){
		game.pause = !game.pause;
	}
	moveView(game);
}
function moveView(game){
	let speed = 5;
	let tension = 2.5;

	tension *= game.options.scale/2;
	if(game.options.scale > 5){
		tension *= 0.75;
	}
	if(game.keyMap.up){
		game.options.translateY += speed * tension;
	}
	else if(game.keyMap.down){
		game.options.translateY -= speed * tension;
	}
	if(game.keyMap.left){
		game.options.translateX += speed * tension;
	}
	else if(game.keyMap.right){
		game.options.translateX -= speed * tension;
	}
}
function gameLoop(game, time){
	if(!game.pause){
		calculate(game);
	}
	draw(game, game.options);
	requestAnimationFrame(time => gameLoop(game, time));
}
function initBattleTab(game){
	function appendFleet(fleet){
		let ships = fleet.ships
			.map(ship => {
				return `
				<div class="ship-container" id="ship-${ship.id}">
					<div class="ship-health"></div>
					<div class="ship-name">${ship.name}</div>
					<div class="ship-class">${ship.shipClass.name}</div>
				</div>`;})
			.join("")
			.replace("	", "");
		return `
		<div class="fleet-container" id="fleet-${fleet.id}">
			<div class="fleet-name">${fleet.name}</div>
			${ships}
		</div>`;
	}
	let container = document.querySelector("#fleet-combat-tab-fleets");
	let fleetTabs = "";

	game.fleets.forEach(fleet => {
		fleetTabs += appendFleet(fleet);
	});

	container.innerHTML = fleetTabs;
	//document.querySelector("#fleet-combat-tab").classList.toggle("hidden");
}
function toggleBattleTab(e){
	function targetIcon(target){
		return target.classList.contains("icon-minimize") ? target : targetIcon(target.parentNode);
	}
	let target = targetIcon(e.target);
	let prevState = target.classList.contains("active") ? "active" : "passive";
	let tab = document.querySelector("#fleet-combat-tab");
	let header = document.querySelector("#fleet-combat-tab-header");

	if(prevState === "passive"){
		tab.style.setProperty("--translate-Y", 
			tab.getBoundingClientRect().height - header.getBoundingClientRect().height + "px");
		document.querySelectorAll("#fleet-combat-tab-indicator > div").forEach(indicator => {
			indicator.classList.add("passive");
		});
	}
	else{
		tab.style.setProperty("--translate-Y", 0);
		document.querySelectorAll("#fleet-combat-tab-indicator > div").forEach(indicator => {
			indicator.classList.remove("passive");
		});
	}
	target.classList.toggle("active");
}
function initBattleIndicators(game){
	let container = document.querySelector("#fleet-combat-tab-indicator");
	let indicators = "";
	game.fleets.forEach(fleet => {
		indicators += `
		<div id="indicator-${fleet.id}" style="--color: ${fleet.color}"></div>
		`;
	});
	indicators = indicators.replace(/\t/g, "");
	container.innerHTML = indicators;
	updateBattleIndicators(game);
}
function updateBattleIndicators(game){
	game.fleets.forEach(fleet => {
		let indicator = document.querySelector(`#indicator-${fleet.id}`);
		let container = document.querySelector("#fleet-combat-tab-indicator");
		let relPower = fleet.power / game.fleets.reduce((acc, fleet) => acc + fleet.power, 0);
		indicator.style.width = `${container.offsetWidth * relPower}px`;
	});
}
function processSave(text){
	const save = Jomini.parse(text);
	const stellFleets = [];
	const stellShips = save.ships;
	const ships = [];
	const fleets = [];
	for(let index in save.fleet){
		if(save.fleet[index].owner === 0 && save.fleet[index].fleet_template){
			stellFleets.push(save.fleet[index]);
		}
	}
	stellFleets.forEach(fleet => {
		let currFleet = new Fleet(fleet.name);
		fleet.ships.forEach(id => {
			let currShip = new Ship(stellShips[id].name);
			let type = save.ship_design[stellShips[id].ship_design].ship_size;
			if(type === "corvette"){
				currShip = currShip.corvette();
			}
			else if(type === "destroyer"){
				currShip = currShip.destroyer();
			}
			else if(type === "cruiser"){
				currShip = currShip.cruiser();
			}
			currFleet.ship = currShip;
			ships.push(currShip);
		});
		fleets.push(currFleet);
	});
}