import {shipSpriteColors} from "./factionColors.js";

export class Fleet{
	constructor(name = "FleetName", faction = "FactionName", color = "blue"){
		this._id = Math.random().toString(32).substr(2, 16);
		this._name = name;
		this._faction = faction;
		this._ships = [];
		this._color = color;
		this._indicator = null;
		this._x = 0;
		this._y = 0;
		this._a = 0;
		this._width = 0;
		this._height = 0;
	}
	get ships(){
		return this._ships;
	}
	get faction(){
		return this._faction;
	}
	get name(){
		return this._name;
	}
	get color(){
		return this._color;
	}
	get id(){
		return this._id;
	}
	get power(){
		const power = this.ships
			.reduce((acc, ship) => {
				if(ship.status === "destroyed")
					return acc;
				return acc + ship.hp;
			}, 0);
		
		return power;
	}
	get liveCorvettesAmount(){
		return this._ships
			.filter(ship => ship.shipClass.name === "corvette" && ship.status !== "destroyed").length;
	}
	get liveDestroyersAmount(){
		return this._ships
			.filter(ship => ship.shipClass.name === "destroyer" && ship.status !== "destroyed").length;
	}
	get liveCruisersAmount(){
		return this._ships
			.filter(ship => ship.shipClass.name === "cruiser" && ship.status !== "destroyed").length;
	}
	get liveBattleshipsAmount(){
		return this._ships
			.filter(ship => ship.shipClass.name === "battleship" && ship.status !== "destroyed").length;
	}
	get liveTitansAmount(){
		return this._ships
			.filter(ship => ship.shipClass.name === "titan" && ship.status !== "destroyed").length;
	}
	get team(){
		return this._team;
	}
	get side(){
		return this._side;
	}
	get indicator(){
		return this._indicator;
	}
	set name(val){
		this._name = val;
	}
	set faction(val){
		this._faction = val;
	}
	set team(val){
		this._team = val;
	}
	set side(obj){
		this._side = obj;
	}
	set indicator(element){
		this._indicator = element;
		this._indicator.style.setProperty("--color", this._color);
	}
	set ship(ship){
		const newShip = ship;
		const alreadyHasIt = this._ships.some(ship => ship.id === newShip.id);

		if(alreadyHasIt){
			console.log(`try to add ${newShip.name} to ${this._name} while it already has it`);
			return false;
		}
		ship.fleet = this;
		this._ships.push(newShip);
		return true;
	}
	calcLocalCoords(){
		function centerLineTo(ships, fleetCenter){
			const coords = ships.map(ship => ship.relCoords.x);
			const left = Math.min(...coords);
			const right = Math.max(...coords);
			const center = left + (right - left) / 2;
			const dX = fleetCenter - center;

			ships.forEach(ship => ship.relCoords.x += dX);
		}
		function alignShips(ships){
			const lines = [...new Set(ships.map(ship => ship.relCoords.row))];
			const firstLineCoords = ships
				.filter(ship => ship.relCoords.row === 0)
				.map(ship => ship.relCoords.x);
			const firstLineLeft = Math.min(...firstLineCoords);
			const firstLineRight = Math.max(...firstLineCoords);
			const fleetCenter = firstLineLeft + (firstLineRight - firstLineLeft) / 2;

			lines.forEach(line => {
				if(line === 0) return;

				const currLineShips = ships.filter(ship => ship.relCoords.row === line);
				centerLineTo(currLineShips, fleetCenter);
			});
		}
		function defineFleetSize(){
			let xCoords = this._ships.map(ship => ship.relCoords.x);
			let yCoords = this._ships.map(ship => ship.relCoords.y);

			this._width = Math.max(...xCoords);
			this._height = Math.max(...yCoords);
		}
		function locateClass(ship, index){
			let startY = 0;
			let currColumn = index;
			let classRow = 0;
			let fleetRow = 0;

			if(this.prev.length){
				startY = Math.max(...this.prev.map(ship => ship.relCoords.y));
				startY += this.params.margin.y;
				fleetRow = Math.max(...this.prev.map(ship => ship.relCoords.row)) + 1;
			}

			while(currColumn >= this.columns){
				currColumn -= this.columns;
				classRow++;
			}		
			ship.relCoords = {
				x: ship.shipClass.margin.x * currColumn,
				y: ship.shipClass.margin.y * classRow + startY,
				row: classRow + fleetRow
			};
		}

		const corvettes = this._ships.filter(ship => ship.shipClass.name === "corvette");
		const destroyers = this._ships.filter(ship => ship.shipClass.name === "destroyer");
		const cruisers = this._ships.filter(ship => ship.shipClass.name === "cruiser");
		const battleships = this._ships.filter(ship => ship.shipClass.name === "battleship");
		const titans = this._ships.filter(ship => ship.shipClass.name === "titan");

		const corvettesInLine = Math.max(Math.round(corvettes.length/3) + 1, 10);
		const destroyersInLine = Math.max(Math.round(destroyers.length/1.7) + 1, 10);
		const cruisersInLine = Math.max(Math.round(cruisers.length/2) + 1, 10);
		const battleshipsInLine = Math.max(Math.round(battleships.length/2) + 1, 10);
		const titansInLine = Math.max(Math.round(titans.length/2) + 1, 10);

		const corvettesPrefs = {columns: corvettesInLine, prev: []};
		const destroyersPrefs = {
			columns: destroyersInLine,
			prev: corvettes,
			params: Ship.corvetteParams()
		};
		const cruisersPrefs = {
			columns: cruisersInLine,
			prev: destroyers,
			params: Ship.destroyerParams()
		};
		const battleshipsPrefs = {
			columns: battleshipsInLine,
			prev: cruisers,
			params: Ship.battleshipParams()
		};
		const titansPrefs = {
			columns: titansInLine,
			prev: battleships,
			params: Ship.titanParams()
		};

		if(!destroyers.length){
			cruisersPrefs.prev = corvettes;
		}
		if(!cruisers.length){
			if(destroyers.length)
				battleshipsPrefs.prev = destroyers;
			else
				battleshipsPrefs.prev = corvettes;
		}
		if(!battleships.length){
			if(cruisers.length)
				titansPrefs.prev = cruisers;
			else if(destroyers.length)
				titansPrefs.prev = destroyers;
			else
				titansPrefs.prev = corvettes;
		}

		corvettes.forEach(locateClass, corvettesPrefs);
		destroyers.forEach(locateClass, destroyersPrefs);
		cruisers.forEach(locateClass, cruisersPrefs);
		battleships.forEach(locateClass, battleshipsPrefs);
		titans.forEach(locateClass, titansPrefs);
		
		alignShips(this._ships);
		defineFleetSize.call(this);
	}
	think(game){
		const sidesPriorities = game.sides
			.filter(side => side.id !== this.side.id)
			.map(side => {
				const power = game.fleets
					.find(fleet => fleet.side.id === side.id)
					.power;
				return {
					id: side.id,
					priority: power / this.power
				};
			});
		this.ships.forEach(ship => ship.thinkNew(game, sidesPriorities));
		console.log(sidesPriorities);
	}
	draw(ctx, sprites){
		ctx.translate(this._x, this._y);
		ctx.rotate(this._a);
		this._ships.forEach(ship => ship.draw(ctx, sprites));
		ctx.rotate(-this._a);
		ctx.translate(-this._x, -this._y);
	}
	updateIndicator(totalPower){
		const relPower = this.power / totalPower;

		this.indicator.style.setProperty("--rel-width", relPower);
	}
	localToGlobalCoords(canvas){
		this._ships.forEach(ship => {
			let cX = this._x;
			let cY = this._y;
			let a = this._a;
			let sin = Math.sin(a);
			let cos = Math.cos(a);
			let shipX = ship.relCoords.x + this._x;
			let shipY = ship.relCoords.y + this._y;
			let nozzleX = ship.relCoords.x + ship.engineRelCoords.x + this._x;
			let nozzleY = ship.relCoords.y + ship.engineRelCoords.y + this._y;

			let na = - a;
			let shipNx = Math.round((cos * (shipX - cX)) + (sin * (shipY - cY)) + cX + canvas.width/2);
			let shipNy = Math.round((cos * (shipY - cY)) - (sin * (shipX - cX)) + cY + canvas.height/2);
			let nozzleNx = Math.round((cos * (nozzleX - cX)) + (sin * (nozzleY - cY)) + cX + canvas.width/2);
			let nozzleNy = Math.round((cos * (nozzleY - cY)) - (sin * (nozzleX - cX)) + cY + canvas.height/2);

			ship.absCoords = {
				x: shipNx,
				y: shipNy,
				a: na
			};
			ship.engineCoords = {
				x: nozzleNx,
				y: nozzleNy
			};
		});
	}
	static positionFleets(fleets){
		const PI = Math.PI;
		let amount = fleets.length;
		let angle = 2 * PI/amount;
		let maxFleetWidth = Math.max(...fleets.map(fleet => fleet._width));
		let yMargin = 50;

		if(amount === 2){
			yMargin += maxFleetWidth/2;
		}
		else if(amount !== 1){
			yMargin += maxFleetWidth * (Math.sin((PI-angle)/2)/Math.sin(angle));
		}

		fleets.forEach((fleet, index) => {
			let cX = 0;
			let cY = 0;
			let a = angle * index;
			let sin = Math.sin(a);
			let cos = Math.cos(a);
			let x = cX - (fleet._width/2);
			let y = cY + yMargin;

			fleet._a = a;
			fleet._x = Math.round((cos * (x - cX)) + (sin * (y - cY)) + cX);
			fleet._y = Math.round((cos * (y - cY)) - (sin * (x - cX)) + cY);
		});
	}
	static generateFleet({
		corvettes: corvettes,
		destroyers: destroyers,
		cruisers: cruisers,
		battleships: battleships,
		titans: titans,
		name: name,
		faction: faction,
		side: side,
		color: color,
		id: id
	}){
		let fleet = new Fleet(name, faction, color);
		for(let i = 0; i < corvettes; i++){
			fleet.ship = new Ship(Ship.randomName("corvette"), faction).corvette();
		}
		for(let i = 0; i < destroyers; i++){
			fleet.ship = new Ship(Ship.randomName("destroyer"), faction).destroyer();
		}
		for(let i = 0; i < cruisers; i++){
			fleet.ship = new Ship(Ship.randomName("cruiser"), faction).cruiser();
		}
		for(let i = 0; i < battleships; i++){
			fleet.ship = new Ship(Ship.randomName("battleship"), faction).battleship();
		}
		for(let i = 0; i < titans; i++){
			fleet.ship = new Ship(Ship.randomName("titan"), faction).titan();
		}
		if(id){
			fleet._id = id;
		}
		fleet.ships.forEach(ship => ship.sideId = side.id);
		fleet.side = {
			name: side.name,
			id: side.id,
			color: color
		};
		return fleet;
	}
	static updateIndicators(game){
		const totalPower = game.fleets
			.reduce((acc, fleet) => acc + fleet.power, 0);

		game.fleets
			.forEach(fleet => fleet.updateIndicator(totalPower));
	}
}
class Weapon{
	constructor(type = "laser", damage = {min: 30, max: 70}, hitChance = 1, cooldown = 2000){
		this._type = type;
		this._damage = damage;
		this._hitChance = hitChance;
		this._cooldown = cooldown;
		this._timeToReady = 0;
		this._beam = {
			startX: 0,
			startY: 0,
			endX: 0,
			endY: 0,
			lifeTime: 0
		};
		this._damageModifiers = [];
		this._reloadModifiers = [];
	}
	hit(target){
		return Math.random() * this._hitChance > target.evace;
	}
	fire(target){
		this.reload();
		
		if(this.hit(target)){
			const damage = Math.random() * (this._damage.max - this._damage.min) + this._damage.min;
			const modifier = this._damageModifiers.reduce((acc, modifier) => {
				return acc + modifier.value;
			}, 1);

			this._beam.endX = target.absCoords.x + Math.random() * 10 - 5;
			this._beam.endY = target.absCoords.y + Math.random() * 10 - 5;
			this._beam.lifeTime = 500;

			target.damage = damage * modifier;
		}
		else{
			this._beam.endX = target.absCoords.x + Math.random() * 10 - 5;
			this._beam.endY = target.absCoords.y + Math.random() * 10 - 5;
			this._beam.lifeTime = 500;
			return;
		}
	}
	reload(coef = 1){
		const modifier = this._reloadModifiers.reduce((acc, modifier) => {
			return acc + modifier.value;
		}, 1);
		this._timeToReady = this._cooldown * coef * modifier;
	}
	update(dTime){
		this._timeToReady -= dTime;
		this._beam.lifeTime -= dTime;
	}
	draw(ctx){
		if(this._beam.lifeTime > 0){
			ctx.save();
			ctx.strokeStyle = "rgba(66, 244, 101, 1)";
			ctx.lineWidth = 0.5;
			ctx.beginPath();
			ctx.moveTo(this._beam.startX, this._beam.startY);
			ctx.lineTo(this._beam.endX, this._beam.endY);
			ctx.stroke();
			ctx.restore();
		}
	}
	set coords(obj){
		this._beam.startX = obj.x;
		this._beam.startY = obj.y;
	}
	get isReady(){
		return this._timeToReady < 0;
	}
}
export class Ship{
	constructor(name = "ShipName", faction = "republican"){
		this._id = Math.random().toString(32).substr(2, 16);
		this._name = name;
		this._faction = faction;
		this._color = this.defineColor();
		this._status = "idle";
		this._hp = 1;
		this._evace = 0;
		this._speed = 0;
		this._maxSpeed = 1;
		this._range = 1;
		this._weapons = [];
		this._crew = 20;
		this._target = null;
		this._fleet = null;
		this._sideId = null;
		this._isTargetOf = [];
		this._element = null;
		this._relCoords = {
			x: 0,
			y: 0
		};
		this._absCoords = {
			x: 0,
			y: 0,
			a: 0
		};
		this._targetCoords = {
			x: 0,
			y: 0,
			a: 0
		};
	}
	get id(){
		return this._id;
	}
	get name(){
		return this._name;
	}
	get evace(){
		return this._evace;
	}
	get status(){
		return this._status;
	}
	get shipClass(){
		return this._class;
	}
	get relCoords(){
		return this._relCoords;
	}
	get absCoords(){
		return this._absCoords;
	}
	get fleet(){
		return this._fleet;
	}
	get color(){
		return this._color;
	}
	get hp(){
		return this._hp;
	}
	get hpMax(){
		return this._hpMax;
	}
	get engineCoords(){
		if(this._engine && this._engine.absX && this._engine.absY){
			return {
				x: this._engine.absX,
				y: this._engine.absY
			};
		}
		else return null;
	}
	get engineRelCoords(){
		if(this._engine){
			return {
				x: this._engine.relX,
				y: this._engine.relY
			};
		}
		else return null;
	}
	get engineTrail(){
		if(this._engine){
			return this._engine.trail;
		}
		else return null;
	}
	get sideId(){
		return this._sideId;
	}
	get element(){
		return this._element;
	}
	get isTargetOf(){
		return this._isTargetOf;
	}
	get target(){
		return this._target;
	}
	set fleet(flt){
		this._fleet = flt;
	}
	set sideId(str){
		this._sideId = str;
	}
	set damage(amount){
		if(this.status === "destroyed") return;

		let damage = amount;
		const damageToShields = Math.min(damage, this._shields);
		const damageToArmour = Math.min(damage - damageToShields, this._armour);
		const damageToHull = Math.min(damage - damageToShields - damageToArmour, this._hp);

		if(damageToShields > 0){
			this._shields = Math.max(this._shields - damageToShields, 0);
		}
		if(damageToArmour > 0){
			this._armour = Math.max(this._armour - damageToArmour, 0);
		}
		if(damageToHull > 0){
			this._hp = Math.max(this._hp - damageToHull, 0);
		}
		
		if(this._hp < this._hpMax * 0.75){
			this.checkForCriticalDamage(this._hp/this._hpMax);
		}
		if(this._hp <= 0){
			this.destroy();
		}
		else{
			this._shieldsIndicator.style = `--amount: ${Math.round(this._shields * 100 / this._shieldsMax)}%`;
			this._armourIndicator.style = `--amount: ${Math.round(this._armour * 100 / this._armourMax)}%`;
			this._hullIndicator.style = `--amount: ${Math.round(this._hp * 100 / this._hpMax)}%`;
		}
	}
	set relCoords({x: xCoord, y: yCoord, row: row}){
		this._relCoords.x = xCoord;
		this._relCoords.y = yCoord;
		this._relCoords.row = row;
	}
	set absCoords({x: xCoord, y: yCoord, a: angle}){
		this._absCoords.x = xCoord;
		this._absCoords.y = yCoord;
		this._absCoords.a = angle;
	}
	set engineCoords(obj){
		this._engine.absX = obj.x;
		this._engine.absY = obj.y;
	}
	set faction(str){
		this._faction = str;
		this._color = this.defineColor();
	}
	set element(el){
		this._element = el;
		this._shieldsIndicator = el.querySelector(".ship-status-shields");
		this._armourIndicator = el.querySelector(".ship-status-armour");
		this._hullIndicator = el.querySelector(".ship-status-hull");
	}
	set target(ship){
		this._target = ship;
		if(ship){
			ship.isTargetOf = this;
		}
	}
	set isTargetOf(ship){
		if(!ship) return;
		this._isTargetOf = this._isTargetOf.filter(enemy => {
			return enemy.status !== "destroyed" && enemy.target === this;
		});
		this._isTargetOf.push(ship);
	}
	think(game){
		if(this._status === "destroyed"){
			return;
		}
		if(this._hp < this._hpCritical){
			this.evacuateCrew();
			return;
		}
		this.update(game.dTime);
		const liveEnemyShips = this._enemyShips.filter(ship => {
			return ship.status !== "destroyed";
		});
		const reachableEnemyShips = liveEnemyShips.filter(ship => {
			return Math.hypot(this._absCoords.x - ship.absCoords.x,
				this._absCoords.y - ship.absCoords.y) <= this._range;
		});

		if(this._target && this._target.status !== "destroyed"){
			const canFire = this._weapons.some(weapon => weapon.isReady);
			if(canFire){
				this.fire(this._debug);
			}
			this._status = "in combat";
		}
		else if(reachableEnemyShips.length > 0){
			this._target = reachableEnemyShips[Math.floor(Math.random() * reachableEnemyShips.length)];
		}
		else if(this._chosenEnemy && this._chosenEnemy.status !== "destroyed"){
			this.directionTo(this._chosenEnemy.absCoords);
			this.angleTo(this._chosenEnemy.absCoords);
			this.moveRad();
			this.moveLin();
			this._status = "moving";
		}
		else if(liveEnemyShips.length > 0){
			let potentialEnemies = liveEnemyShips;
			this._chosenEnemy = potentialEnemies[Math.floor(Math.random() * potentialEnemies.length)];
		}
		else{
			this._chosenEnemy = null;
			this._status = "idle";
			game.events.endFleetSim.try(game);
		}
		this.moveRad();
	}
	//TODO rename new method, delete old method
	thinkNew(game, sidesPriorities){
		if(this._status === "destroyed"){
			return;
		}
		let maxPriority = 1;
		let shipWithHighestPriority = null;

		//TODO remove after debug
		if(this._name === "ISS Debug"){
			this._debugPriorities = [];
		}
		
		this._enemyShips
			.filter(ship => ship.status !== "destroyed")
			.forEach(ship => {
				const distanceCoef = 4;
				const typeCoef = 0.1;
				const sidePriorityCoef = 1;
				const typesPriorities = {
					corvette: 0,
					destroyer: 1,
					cruiser: 2,
					battleship: 3,
					titan: 4,
				};
				const sidePriority = sidesPriorities.find(side => side.id === ship.sideId).priority;
				const targetPriority = ship.isTargetOf ? 1 / 2**ship.isTargetOf.length : 0;
				const distanceToShip = this.distanceTo(ship.absCoords);
				const isTargetOf = this._isTargetOf.find(enemy => enemy.id === ship.id);
				const isTargetOfCoef = isTargetOf ? 1.05 : 1;
				let inCombatCoef = 2;
				let reversedTypePriority = 1;
				let shipPriority = 1;

				//if in shooting range with ship with a small margin
				//for manuevers
				if(distanceToShip <= (this._range + this._range * 0.05)){
					inCombatCoef += 0.1;
					if(isTargetOf){
						reversedTypePriority += ship.hp / ship.hpMax * 0.01;
					}
				}

				shipPriority *= 1 + 1 / distanceToShip * distanceCoef;
				shipPriority *= 1 + 1 / (Math.abs(typesPriorities[this.shipClass.name] -
					typesPriorities[ship.shipClass.name]) + 1) * typeCoef;
				shipPriority *= 1 + sidePriority * sidePriorityCoef;
				shipPriority *= 1 + targetPriority;
				shipPriority *= inCombatCoef;
				shipPriority *= isTargetOfCoef;
				shipPriority *= reversedTypePriority;
				
				if(shipPriority >= maxPriority){
					maxPriority = shipPriority;
					shipWithHighestPriority = ship;
				}
				//TODO remove after debug
				if(this._name === "ISS Debug"){
					this._debugPriorities.push(
						{
							type: ship.shipClass.name,
							priority: shipPriority,
							distance: this.distanceTo(ship.absCoords)
						}
					);
				}
			});

		if(shipWithHighestPriority === null){
			const randomEnemyShip = this._enemyShips[Math.floor(Math.random() * this._enemyShips.length)];
			this.target = randomEnemyShip;
		}
		else{
			this.target = shipWithHighestPriority;
		}
		//TODO remove after debug
		if(this._name === "ISS Debug"){
			console.table(this._debugPriorities);
		}
		this.update(game.dTime);
	}
	angleTo({x: x, y: y}){
		if(x === this._absCoords.x && y === this._absCoords.y){
			return;
		}
		let angle = Math.atan2(this._absCoords.y - y, this._absCoords.x - x) - Math.PI / 2;
		this._targetCoords.a = angle;
	}
	directionTo({x: x, y: y}){
		this._targetCoords.x = x;
		this._targetCoords.y = y;
	}
	distanceTo({x: x, y: y}){
		return Math.hypot(this._absCoords.x - x, this._absCoords.y - y);
	}
	defineEnemies(ships){
		this._enemyShips = ships.filter(ship => ship.sideId !== this._sideId);
	}
	checkForCriticalDamage(relativeHp){
		const chanceToKillCrewMembers = Math.min(0.05 / relativeHp, 0.5);
		
		if(Math.random() < chanceToKillCrewMembers){
			this.killCrewMembers(Math.random() * 0.1 + 0.05);
		}
	}
	destroy(){
		this.killCrewMembers(0.94);
		this._status = "destroyed";
		this._element.remove();
	}
	evacuateCrew(){
		this._status = "destroyed";
		this._element.remove();
	}
	killCrewMembers(percents){
		const killed = Math.round(this._crew * percents);
		this._crew -= killed;
		if(this._crew < 0){
			this._crew = 0;
		}
	}
	fire(){
		this._weapons
			.filter(weapon => weapon.isReady)
			.forEach(weapon => weapon.fire(this._target, this._debug));
	}
	moveLin(){
		const COEF = 0.2;
		const FPS = 60 / 1000;
		const dx = this._absCoords.x - this._targetCoords.x;
		const dy = this._absCoords.y - this._targetCoords.y;
		const angle = Math.atan2(this._absCoords.y - this._targetCoords.y, this._absCoords.x - this._targetCoords.x);
		if(this._speed + this._maxSpeed/10 < this._maxSpeed){
			this._speed += this._maxSpeed/100;
		}
		else{
			this._speed = this._maxSpeed;
		}
		const linSpeed = this._speed * FPS * COEF;

		if(Math.hypot(dx, dy) < linSpeed){
			this._absCoords.x = this._targetCoords.x;
			this._absCoords.y = this._targetCoords.y;
			this._speed = 0;
		}
		else if(dx <= 0){
			this._absCoords.x += linSpeed * Math.abs(Math.cos(angle));
		}
		else{
			this._absCoords.x += -linSpeed * Math.abs(Math.cos(angle));
		}
		if(dy <= 0){
			this._absCoords.y += linSpeed * Math.abs(Math.sin(angle));
		}
		else{
			this._absCoords.y += -linSpeed * Math.abs(Math.sin(angle));
		}
	}
	moveRad(){
		const COEF = 0.2;
		const FPS = 60 / 1000;
		const da = this._absCoords.a - this._targetCoords.a;
		const radSpeed = this._speed * FPS * 2 * Math.PI * COEF / 180;

		if(Math.abs(da) < radSpeed){
			this._absCoords.a = this._targetCoords.a;
		}
		else{
			this._absCoords.a += -Math.sign(da) * radSpeed;
		}
	}
	update(dTime){
		const critialDamage = this._hp < this._hpCritical;
		const hasTarget = this._target && this._target.status !== "destroyed";
		const targetInRange = this.distanceTo(this._target.absCoords) <= this._range;
		const canFire = hasTarget
			&& targetInRange
			&& this._weapons.some(weapon => weapon.isReady);

		if(critialDamage){
			this.evacuateCrew();
			return;
		}
		if(hasTarget && !targetInRange){
			this.directionTo(this._target.absCoords);
			this.angleTo(this._target.absCoords);
			this.moveLin();
		}
		if(canFire){
			this.fire();
		}
		this.moveRad();
		this.updateEngine(dTime);
		this.updateWeapons(dTime);
	}
	updateEngine(dTime){
		if(this.status !== "destroyed" && this.status !== "in combat"){
			const local = {
				relX: this._engine.relX,
				relY: this._engine.relY
			};
			const point = this.toGlobal(local);

			point.lifeTime = 1000;
			this._engine.trail.push(point);
		}

		this._engine.trail.forEach(point => {
			point.lifeTime -= dTime;
		});
		this._engine.trail = this._engine.trail.filter(point => point.lifeTime > 0);
	}
	updateWeapons(dTime){
		this._weapons.forEach(weapon => {
			weapon.coords = this.toGlobal(this._weaponsRelCoords);
			weapon.update(dTime);
		});
	}
	corvette(){
		this._class = {
			name: "corvette",
			size: {
				x: 4,
				y: 11
			},
			margin: {
				x: 21,
				y: 18
			}
		};
		this._hpMax = 500;
		this._hpCritical = 50;
		this._hp = this._hpMax;
		this._armourMax = 100;
		this._armour = this._armourMax;
		this._shieldsMax = 100;
		this._shields = this._shieldsMax;
		this._evace = 0.3;
		this._range = 60;
		this._maxSpeed = 30;
		this._crewMax = 20;
		this._crew = this._crewMax;
		this._weapons = [
			new Weapon("laser", {min: 20, max: 40}, 0.95, 3000),
			new Weapon("cinetic", {min: 20, max: 50}, 0.8, 3000)
		];
		this._weaponsRelCoords = {
			relX: 0,
			relY: 0
		};
		this._engine = {
			relX: 0,
			relY: 5,
			trail: []
		};
		return this;
	}
	destroyer(){
		this._class = {
			name: "destroyer",
			size: {
				x: 6,
				y: 17
			},
			margin: {
				x: 20,
				y: 23
			}
		};
		this._hpMax = 900;
		this._hpCritical = 90;
		this._hp = this._hpMax;
		this._armourMax = 300;
		this._armour = this._armourMax;
		this._shieldsMax = 300;
		this._shields = this._shieldsMax;
		this._evace = 0.2;
		this._range = 90;
		this._maxSpeed = 25;
		this._crewMax = 50;
		this._crew = this._crewMax;
		this._weapons = [
			new Weapon("laser", {min: 30, max: 50}, 0.95, 3100),
			new Weapon("cinetic", {min: 40, max: 70}, 0.8, 3500)
		];
		this._weaponsRelCoords = {
			relX: 0,
			relY: 0
		};
		this._engine = {
			relX: 0,
			relY: 8,
			trail: []
		};
		return this;
	}
	cruiser(){
		this._class = {
			name: "cruiser",
			size: {
				x: 10,
				y: 26
			},
			margin: {
				x: 28,
				y: 30
			}
		};
		this._hpMax = 1400;
		this._hpCritical = 140;
		this._hp = this._hpMax;
		this._armourMax = 500;
		this._armour = this._armourMax;
		this._shieldsMax = 500;
		this._shields = this._shieldsMax;
		this._evace = 0.15;
		this._range = 120;
		this._maxSpeed = 20;
		this._crewMax = 90;
		this._crew = this._crewMax;
		this._weapons = [
			new Weapon("laser", {min: 40, max: 60}, 0.95, 3300),
			new Weapon("cinetic", {min: 40, max: 70}, 0.8, 3500),
			new Weapon("cinetic", {min: 40, max: 70}, 0.8, 3500)
		];
		this._weaponsRelCoords = {
			relX: 0,
			relY: 0
		};
		this._engine = {
			relX: 0,
			relY: 13,
			trail: []
		};
		return this;
	}
	battleship(){
		this._class = {
			name: "battleship",
			size: {
				x: 16,
				y: 35
			},
			margin: {
				x: 40,
				y: 42
			}
		};
		this._hpMax = 2500;
		this._hpCritical = 220;
		this._hp = this._hpMax;
		this._armourMax = 800;
		this._armour = this._armourMax;
		this._shieldsMax = 1100;
		this._shields = this._shieldsMax;
		this._evace = 0.1;
		this._range = 200;
		this._maxSpeed = 19;
		this._crewMax = 130;
		this._crew = this._crewMax;
		this._weapons = [
			new Weapon("laser", {min: 65, max: 90}, 0.95, 3600),
			new Weapon("laser", {min: 65, max: 90}, 0.95, 3600),
			new Weapon("cinetic", {min: 50, max: 100}, 0.7, 3800)
		];
		this._weaponsRelCoords = {
			relX: 0,
			relY: 0
		};
		this._engine = {
			relX: 0,
			relY: 18,
			trail: []
		};
		return this;
	}
	titan(){
		this._class = {
			name: "titan",
			size: {
				x: 26,
				y: 70
			},
			margin: {
				x: 55,
				y: 80
			}
		};
		this._hpMax = 4000;
		this._hpCritical = 220;
		this._hp = this._hpMax;
		this._armourMax = 1200;
		this._armour = this._armourMax;
		this._shieldsMax = 1750;
		this._shields = this._shieldsMax;
		this._evace = 0.05;
		this._range = 250;
		this._maxSpeed = 19;
		this._crewMax = 200;
		this._crew = this._crewMax;
		this._weapons = [
			new Weapon("laser", {min: 65, max: 90}, 0.95, 3600),
			new Weapon("laser", {min: 65, max: 90}, 0.95, 3600),
			new Weapon("cinetic", {min: 50, max: 100}, 0.7, 3800)
		];
		this._weaponsRelCoords = {
			relX: 0,
			relY: -35
		};
		this._engine = {
			relX: 0,
			relY: 35,
			trail: []
		};
		return this;
	}
	defineColor(){
		const factionColor = shipSpriteColors.get(this._faction.toLowerCase());

		if(!factionColor)
			return "blue";
		return factionColor;
	}
	draw(ctx, sprites){
		if(this._status === "destroyed") return;
		ctx.translate(this._absCoords.x, this._absCoords.y);
		ctx.rotate(this._absCoords.a);

		ctx.drawImage(sprites[this._class.name][this.color], -this._class.size.x/2, -this._class.size.y/2, this._class.size.x, this._class.size.y);

		ctx.rotate(-this._absCoords.a);
		ctx.translate(-this._absCoords.x, -this._absCoords.y);
	}
	drawLaserBeams(ctx){
		if(this._status === "destroyed") return;
		this._weapons.forEach(weapon => weapon.draw(ctx));
	}
	drawEngineTrail(ctx){
		if(this._status === "destroyed") return;
		const trail = this.engineTrail;
		ctx.save();
		ctx.strokeStyle = `rgba(63, 137, 255, ${0.8})`;
		ctx.beginPath();
		trail.forEach((point, i, arr) => {
			const nextPoint = arr[i + 1];
			if(nextPoint){
				ctx.moveTo(point.x, point.y);
				ctx.lineTo(nextPoint.x, nextPoint.y);
			}
		});
		ctx.stroke();
		ctx.restore();
	}
	toGlobal({relX, relY}){
		function rotate({x, y, cx, cy}, angle) {
			const cos = Math.cos(-angle);
			const sin = Math.sin(-angle);
			const nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
			const ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
			
			return {
				x: nx,
				y: ny
			};
		}
		return rotate({
			x: relX + this._absCoords.x,
			y: relY + this._absCoords.y,
			cx: this._absCoords.x,
			cy: this._absCoords.y
		}, this._absCoords.a);
	}
	static corvetteParams(){
		return {
			size: {
				x: 4,
				y: 11
			},
			margin: {
				x: 21,
				y: 18
			}
		};
	}
	static destroyerParams(){
		return {
			size: {
				x: 6,
				y: 17
			},
			margin: {
				x: 20,
				y: 23
			}
		};
	}
	static cruiserParams(){
		return {
			size: {
				x: 10,
				y: 26
			},
			margin: {
				x: 28,
				y: 30
			}
		};
	}
	static battleshipParams(){
		return {
			size: {
				x: 16,
				y: 35
			},
			margin: {
				x: 40,
				y: 42
			}
		};
	}
	static titanParams(){
		return {
			size: {
				x: 26,
				y: 70
			},
			margin: {
				x: 55,
				y: 80
			}
		};
	}
	static randomName(shipClass){
		function getRandom(arr){
			return arr[Math.floor(Math.random() * arr.length)];
		}
		let nameList = "";
		if(shipClass === "battleship"){
			nameList = `
			Vengeance Triumphant Nemesis Avenger Champion 
			Conqueror Crusader Judicator Vanguard Renown 
			Demolisher Dragon Furious Gladiator Magnificent 
			Onslaught Revenge Vanquisher Vehement Basilisk 
			Tempest Warrior Nike Paladin Sovereign Repulse Majestic 
			Centurion Citadel Dreadnought Leviathan Katana Cerberus 
			Valkyrie Hyperion Galatea Ambush Vindicator Indomitable 
			Sentinel Brilliant Blazer Audacity Gallant Nova Shadow 
			Allegiance Challenger Fearless Protector Victorious 
			Courageous Defiance Valorous Azrael Thanatos Cronus 
			Helios Crius Hades Epimetheus Prospero Untiring Zenith 
			Meridian Conquistador Scylla Tormentor Warlord Devastator 
			Artemis Vigilance Decimator Legion Reprisal Unrivalled 
			Warhammer Retribution Infinity Eviscerator Eminence 
			Relentless Archon Typhon Pinnacle Bastion Incomparable 
			Invictus Requiem Dominance Armageddon Preponderous 
			Consummate Perfection Incorruptible Impregnable 
			Insurmountable Impenetrable Unbreakable Implacable 
			Impervious Inexorable Unyielding Ogre Avatar
			`;
		}
		else if(shipClass === "cruiser"){
			nameList = `
			Acheron Achilles Agamemnon Amphion Aquilon Argonaut 
			Argus Ariel Aurora Avernus Bacchus Bucephalus Calliope 
			Calypso Castor Charybdis Circe Cleopatra Constantine 
			Cordelia Cyrus Damocles Daedalus Darius Diomede Dryad 
			Electra Endymion Erebus Fenris Freya Gilgamesh Gorgon 
			Halcyon Hecate Hector Hesperus Janus Jason Juno Jupiter 
			Lancelot Lazarus Leander Leonidas Lysander Maenad Mars 
			Medea Medusa Menestheus Mercury Merlin Minerva Minos 
			Neptune Nessus Nestor Nimrod Niobe Oberon Odin Ophelia 
			Orestes Orpheus Osiris Pandora Penelope Persephone Perseus 
			Phoebe Pluto Poseidon Proteus Pylades Serapis Stygian Tantalus 
			Telemachus Theseus Thor Trajan Triton Venus Adamant Ardent 
			Assail Austere Adroit Aegis Anchor Corsair Banshee Enchantress 
			Aggressor Assault Excellence Senator Tornado Usurper Utmost 
			Whirlwind Athena Loki Anubis Uziel Cephalus Deimos Ares Mjolnir 
			Fafnir Galahad Shiva Aeolus Ganymede Zephyrus Pharos Alastor 
			Horus Anhur Amun Sekhmet Sobek Aeshma Toutatis Seraphim Idomeneus 
			Ravana Abaddon Tiamat Taranis Hedetet Agni Arethusa Atropos 
			Atum Chiron Gawain Percival Tristan Ishtar Ivanhoe Marduk Menelaus 
			Midas Ozymandias Parnassus Priam Thetis Xanthus Narayana Eris Boreas 
			Thalassa Atreus Bellona Raijin Tyr Bastet Andromache Avalon Durendal Unswerving
			`;
		}
		else if(shipClass === "destroyer"){
			nameList = `
			Cyclops Centaur Adversary Assassin Dagger Daring Duty Havoc 
			Hero Hunter Justice Impeccable Interceptor Infernal Loyal 
			Matchless Mauler Mayhem Malice Menace Merciless Mischief 
			Monarch Patriot Predator Powerful Punisher Ravager Reaper 
			Savage Spiteful Templar Terminator Terror Thrasher Minotaur 
			Manticore Interdictor Intruder Hydra Enfield Harasser 
			Unbeaten Werewolf Zealous Petulant Phantom Phoenix Pike 
			Pursuer Raider Rainbow Rapid Redemption Rigorous Robust 
			Sabre Salvation Sanguine Scarab Scepter Siren 
			Sorceress Spearhead Specter Spirit Splendid Stallion Stalwart 
			Steadfast Strenuous Superb Supernova Surprise Swiftsure 
			Talent Talisman Talon Taurus Tenacious 
			Thunderous Tireless Trenchant Righteous Trident Trojan Trumpet 
			Truncheon Typhoon Undaunted Venture Versatile Vigorous Viper 
			Vivacious Winger Wizard Wyvern Wolfhound Trinity Outrage Argo 
			Cygnus Awesome Trebuchet Avalanche Carronade Garm Demon Satyr 
			Boanerges Erinyes Rakshasa Rephaim Sephiroth Alchemist Audacious 
			Canticle Cantrip Culverin Goblin Hippogriff Impulse Inspired 
			Intolerant Ironside Irresistible Magician Magus Mandrake Shaman 
			Sorcerer Thaumaturge Truculent Turbulent Unconquered Insuperable 
			Ascendant Archangel Intransigent Warlock Paradigm Probity
			`;
		}
		else {
			nameList = `
			Agile Archer Arrow Bruiser Cherub Chimera Claymore Broadsword 
			Battleaxe Cutlass Deterrent Errant Faithful Fierce Gladius Grappler 
			Hammer Vampire Velox Venator Vendetta Venerable Venomous Taciturn 
			Supreme Success Shredder Seraph Serpent Spitfire Stalker Stratagem 
			Scimitar Scorcher Scourge Scythe Revenant Redoubtable Raptor Reaver 
			Prodigal Rapier Prudent Persistent Peerless Myrmidon Indignant Javelin 
			Knight Starwolf Bonaventure Adventure Boxer Buccaneer Cavalier 
			Celestial Chariot Comet Crucible Cyclone Decisive Dexterous Diadem 
			Earnest Eclipse Forger Fortune Gauntlet Griffin Horizon Hotspur 
			Hurricane Hussar Jubilant Lancer Lightning Magic Mediator Mermaid 
			Meteor Minstrel Miranda Mustang Sharpshooter Mystic Naiad Nautilus 
			Nebula Nimble Nymph Obdurate Ocean Onward Oracle Paradox 
			Paragon Pearl Peregrine Perseverance Marksman Rifleman Sniper Maelstrom 
			Lucidity Berserker Brigand Celerity Cudgel Cuirass Growler Incubus 
			Prowler Fury Fireball Dart Falchion Spadroon Longsword Bolo Spatha 
			Xiphos Mirage Snapper Firebrand Ambuscade Attack Buckler 
			Conquest Domino Gemini Glaive Halberd Harpy Kite Petard Regal Reprise 
			Skirmisher Sprite Succubus Tisiphone Alecto Megaera Troubadour Balladeer 
			Bard Cannonball Horatius Rampart Serenader Dirk Epee Glimmer Cockatrice
			`;
		}

		nameList = nameList
			.replace(/\t/g, "")
			.split(" ");
		return "ISS " + getRandom(nameList);
	}
}