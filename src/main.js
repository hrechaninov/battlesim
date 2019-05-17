import {Fleet} from "./ship.js";
import Sprites from "./sprites.js";
import Game from "./game.js";
import {Event} from "./event.js";
import UserInputConfig from "./userInputConfig.js";
import {mockFleets} from "./mock.js";
import "./htmlTemplate";
import toHTML from "./htmlTemplate";
import {locale} from "./locale.js";

window.onload = loadPage;

async function loadPage(){
	//const config = new UserInputConfig();
	const sprites = await new Sprites().loadSprites();
	const canvas = document.querySelector("#fleet-canvas");

	window.addEventListener("resize", function(){
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	});

	//const {fleets, armies} = await config.finishConfig();
	const fleets = mockFleets();
	const fg = startNewGame(fleets, canvas, sprites);

	window.devConsole = devConsole(fg);

	fg.container = document.querySelector("#fleet-battle-screen");
	fg.container.classList.toggle("hidden-hard");
	initEvents(fg);
	fg.events.startFleetSim.try(fg);
	await fg.toStart;
	gameLoop(fg);
	initBattleTab(fg);
	initBattleIndicators(fg);
	
	canvas.addEventListener("wheel", e => zoomView(e, fg));
	document.addEventListener("keydown", e => keyDown(e, fg));
	document.addEventListener("keyup", e => keyUp(e, fg));
	document
		.querySelector("#fleet-combat-tab-icon")
		.addEventListener("click", e => toggleBattleTab(e));
	document
		.querySelector(".play-pause-indicator-icon")
		.addEventListener("click", e => {
			togglePause(fg, e.currentTarget);
		});
}
function startNewGame(fleets, canvas, sprites){
	const fg = new Game(canvas);
	
	fg.canvas.width = window.innerWidth;
	fg.canvas.height = window.innerHeight;
	fg.sprites = sprites;

	initFleets(fg, fleets);

	return fg;
}
function initEvents(game){
	const lorem = "Events occur throughout the course of play. There are a whole range of events in the game, which can result in positive, negative and mixed outcomes for a player's empire. They take the form of a pop-up notification on the player's screen, which may present a player with a choice, or may simply inform the player of the consequences and require they acknowledge the event has occurred.";
	game.events.startFleetSim = new Event({
		name: "Начало сражения",
		descr: lorem
	});
	game.events.endFleetSim = new Event({
		name: "Конец сражения",
		descr: lorem
	});

	game.events.startFleetSim.onFire = ((game, event) => {
		const forcesReports = game.sides
			.map(side => {
				const sideShips = game.ships
					.filter(ship => ship.sideId === side.id);
				const sideMen = sideShips
					.reduce((acc, ship) => {
						return acc + ship._crew;
					}, 0);
				return `на стороне ${side.name}: ${sideShips.length} кораблей и ${sideMen} членов экипажа`;
			})
			.join("<br>");
		game.eventParams.startForces = game.ships.reduce((acc, ship) => {
			return {
				men: acc.men + ship._crew,
				ships: acc.ships + 1
			};
		}, {men: 0, ships: 0});
		event.descr = `В сражении принимают участие<br>${forcesReports}`;
	}).bind(null, game, game.events.startFleetSim);
	game.events.startFleetSim.option = {
		name: "Начать",
		descr: "",
		callbacks: [
			(game => {
				game.start();
			}).bind(null, game)
		]
	};

	game.events.endFleetSim.onFire = ((game, event) => {
		const liveShips = game.ships.filter(ship => ship.status !== "destroyed");
		const liveShipsSideIds = liveShips.map(ship => ship.sideId);
		const winnerSidesIds = [...new Set(liveShipsSideIds)];
		const winnerSides = winnerSidesIds.map(sideId => {
			const side = game.sides.find(side => side.id === sideId);
			return side;
		});
		const winnerSidesNames = winnerSides
			.map(side => side.name)
			.join(", ");

		const lossesReports = game.sides
			.map(side => {
				const sideShips = game.ships
					.filter(ship => ship.sideId === side.id);
				const sideShipsLost = sideShips
					.filter(ship => ship.status === "destroyed");
				const sideMenLost = sideShips.reduce((acc, ship) => {
					return acc + ship._crewMax - ship._crew;
				}, 0);
				return `${side.name} потеряли ${sideShipsLost.length} кораблей и ${sideMenLost} храбрых членов экипажа.`;
			})
			.join("<br>");

		event.descr = `В сражении победили ${winnerSidesNames}.<br>${lossesReports}`;
	}).bind(null, game, game.events.endFleetSim);

	game.events.endFleetSim.option = {
		name: "Vae victus",
		descr: "",
		callbacks: [
			(game => {
				game.pause = true;
			}).bind(null, game),
			(game => {
				game.end();
			}).bind(null, game)
		]
	};
	game.events.endFleetSim.option = {
		name: "Начать заново",
		descr: "",
		callbacks: [
			() => window.location.reload(false)
		]
	};
}
function initFleets(game, fleets){
	function shuffle(arr) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}
	game.fleets = fleetsBySides(game, fleets);
	game.fleets.forEach((fleet) => {
		fleet.calcLocalCoords();
	});
	Fleet.positionFleets(game.fleets);
	game.fleets.forEach(fleet => {
		game.ships = game.ships.concat(fleet.ships);
		fleet.localToGlobalCoords(game.canvas);
	});
	game.ships = shuffle(game.ships);
	game.ships.forEach(ship => ship.defineEnemies(game.ships));
}
function fleetsBySides(game, fleets){
	const sides = fleets.map(fleet => fleet.side);
	const addedSidesIds = [];
	const ships = [];

	game.sides = sides.reduce((acc, side) => {
		const alreadyAdded = addedSidesIds.some(id => id === side.id);
		
		if(!alreadyAdded){
			acc.push(side);
			addedSidesIds.push(side.id);
		}
		return acc;
	}, []);
	
	fleets.forEach(fleet => fleet.ships.forEach(ship => ships.push(ship)));

	return game.sides.map(side => {
		const sideFleet = new Fleet(side.name, null, side.color);
		sideFleet.side = side;
		ships
			.filter(ship => ship.sideId === side.id)
			.forEach(ship => sideFleet.ship = ship);
		return sideFleet;
	});
}
function drawShips(game){
	game.ships.forEach(ship => {
		ship.drawEngineTrail(game.ctx);
		ship.draw(game.ctx, game.sprites);
		ship.drawLaserBeams(game.ctx);
	});
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
	Fleet.updateIndicators(game);
	game.fleets.forEach(fleet => fleet.think(game));
}
function zoomView(e, game){
	//вирахувати положення курсора до зуму
	//як координату від лівого верхнього кута зі старим масштабом
	//обчислити новий масштаб
	//змінити масштаб
	//вирахувати новий відступ з урахуванням нового масштабу
	//змінити відступ
	const speed = 1/1000;
	const prevScale = game.options.scale;
	const newScale = prevScale + speed * -e.deltaY;
	const d = {
		x: (e.clientX * prevScale - e.clientX * newScale) / (newScale / prevScale),
		y: (e.clientY * prevScale - e.clientY * newScale) / (newScale / prevScale)
	};

	e.preventDefault();
	if(newScale >= 10){
		return;
	}
	else if(newScale <= 0.6){
		return;
	}
	else{
		game.options.scale = newScale;
		game.options.translateX += d.x;
		game.options.translateY += d.y;
	}
}
function keyUp(e, game){
	if(e.key === "w" || e.key === "ц"){
		game.keyMap.up = false;
	}
	else if(e.key === "s" || e.key === "ы"){
		game.keyMap.down = false;
	}
	if(e.key === "a" || e.key === "ф"){
		game.keyMap.left = false;
	}
	else if(e.key === "d"  || e.key === "в"){
		game.keyMap.right = false;
	}
	moveView(game);
}
function keyDown(e, game){
	if(e.key === "w" || e.key === "ц"){
		game.keyMap.up = true;
	}
	else if(e.key === "s" || e.key === "ы"){
		game.keyMap.down = true;
	}
	if(e.key === "a" || e.key === "ф"){
		game.keyMap.left = true;
	}
	else if(e.key === "d"  || e.key === "в"){
		game.keyMap.right = true;
	}
	if(e.key === " "){
		e.preventDefault();

		const pauseIcon = document.querySelector(".play-pause-indicator-icon");
		togglePause(game, pauseIcon);
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
function togglePause(game, icon){
	game.pause = !game.pause;
	if(icon && icon.classList){
		icon.classList.toggle("play-pause-indicator-icon--paused");
		icon.classList.toggle("play-pause-indicator-icon--play");
	}
}
function gameLoop(game, time){
	if(!game.pause){
		game.tick(time);
		calculate(game);
	}
	game.prevTime = time;
	draw(game, game.options);
	requestAnimationFrame(time => gameLoop(game, time));
}
function initBattleTab(game){
	function appendFleet(fleet, container){
		const fleetTemplate = `
		<div class="fleet-container" id="fleet-${fleet.id}">
			<div class="fleet-name">${fleet.name}</div>
			<div class="ships-container"></div>
		</div>`;
		const fleetElement = toHTML(fleetTemplate);
		const shipsContainer = fleetElement.querySelector(".ships-container");

		fleet.ships.forEach(ship => {
			const order = {
				corvette: 0,
				destroyer: 1,
				cruiser: 2,
				battleship: 3,
				titan: 4
			};
			const shipTemplate = `
			<div class="ship-container" id="ship-${ship.id}" style="--order: ${order[ship.shipClass.name]}">
				<div class="ship-status-container">
					<div class="ship-status ship-status-shields" style="--amount: 100%"></div>
					<div class="ship-status ship-status-armour" style="--amount: 100%"></div>
					<div class="ship-status ship-status-hull" style="--amount: 100%"></div>
				</div>
				<div class="ship-name">${ship.name}</div>
				<div class="ship-class">${locale.get(ship.shipClass.name)}</div>
			</div>`;
			const shipElement = toHTML(shipTemplate);
			ship.element = shipElement;
			shipsContainer.append(shipElement);
		});

		container.append(fleetElement);
	}
	let container = document.querySelector("#fleet-combat-tab-fleets");

	game.fleets.forEach(fleet => {
		appendFleet(fleet, container);
	});
	document.querySelector("#fleet-combat-tab").classList.toggle("hidden-hard");
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
	const container = document.querySelector("#fleet-combat-tab-indicator");
	game.fleets.forEach(fleet => {
		const indicatorStr = `
		<div id="indicator-${fleet.id}" style="--color: ${fleet.color}"></div>
		`;
		const indicator = toHTML(indicatorStr);

		fleet.indicator = indicator;
		container.append(indicator);
	});
	Fleet.updateIndicators(game);
}
function devConsole(game){
	return {
		fg: game,
		killShip: function(shipName){
			const ship = this.fg.ships
				.find(ship => ship.name === shipName);
			if(ship){
				ship.destroy();
				console.log(`ship ${shipName} destroyed`);
			}
			else{
				console.log(`ship ${shipName} not found`);
			}
		},
		watchShipsCoords: function(){
			return this.fg.ships.map(ship => ship.absCoords);
		},
		watchShipTarget: function(shipName){
			return this.fg.ships
				.find(ship => ship.name === shipName)
				.target
				.name;
		},
		randomWatch: function(className = ""){
			let ships = this.fg.ships;
			if(className.length){
				ships = ships.filter(ship => ship.shipClass.name === className);
			}
			const ship = ships[Math.floor(Math.random() * ships.length)];
			ship._name = "ISS Debug";
			console.log(`${ship.shipClass.name} ${ship.name} from ${ship.fleet.name} is now watched`);
			return ship;
		}
	};
}