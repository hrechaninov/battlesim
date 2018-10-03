export class Fleet{
	constructor(name = "FleetName", faction = "FactionName", color = "blue"){
		this._id = Math.random().toString(32).substr(2, 16);
		this._name = name;
		this._faction = faction;
		this._ships = [];
		this._color = color;
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
		return 100;
	}
	get corvettesAmount(){
		return this._ships.filter(ship => ship.shipClass.name === "corvette");
	}
	get destroyersAmount(){
		return this._ships.filter(ship => ship.shipClass.name === "destroyer");
	}
	get cruisersAmount(){
		return this._ships.filter(ship => ship.shipClass.name === "cruiser");
	}
	get battleshipsAmount(){
		return this._ships.filter(ship => ship.shipClass.name === "battleship");
	}
	get team(){
		return this._team;
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
		function align(currentShips, prevShips){
			let prevCoords = prevShips.map(ship => ship.relCoords.x);
			let prevLeft = Math.min(...prevCoords);
			let prevRight = Math.max(...prevCoords);

			let currentCoords = currentShips.map(ship => ship.relCoords.x);
			let currentLeft = Math.min(...currentCoords);
			let currentRight = Math.max(...currentCoords);

			const startX = ((prevRight - prevLeft) - (currentRight - currentLeft)) / 2;

			currentShips.forEach(ship => ship.relCoords.x += (startX + prevLeft));
		}
		function defineFleetSize(){
			let xCoords = this._ships.map(ship => ship.relCoords.x);
			let yCoords = this._ships.map(ship => ship.relCoords.y);

			this._width = Math.max(...xCoords);
			this._height = Math.max(...yCoords);
		}

		const corvettes = this._ships.filter(ship => ship.shipClass.name === "corvette");
		const destroyers = this._ships.filter(ship => ship.shipClass.name === "destroyer");
		const cruisers = this._ships.filter(ship => ship.shipClass.name === "cruiser");

		const corvettesInLine = 10;
		const destroyersInLine = 10;
		const cruisersInLine = 8;

		corvettes.forEach((corvette, index) => {
			if(index < corvettesInLine){
				corvette.relCoords = {
					x: corvette.shipClass.margin.x * index,
					y: 0
				};
			}
			else{
				corvette.relCoords = {
					x: corvette.shipClass.margin.x * (index - corvettesInLine),
					y: corvette.shipClass.margin.y
				};
			}
		});
		destroyers.forEach((destroyer, index) => {
			const startY = Ship.corvetteParams().margin.y * Math.ceil(corvettes.length/corvettesInLine);

			if(index < destroyersInLine){
				destroyer.relCoords = {
					x:destroyer.shipClass.margin.x * index,
					y: startY
				};
			}
			else{
				destroyer.relCoords = {
					x:destroyer.shipClass.margin.x * (index - destroyersInLine),
					y: startY + destroyer.shipClass.margin.y
				};
			}
		});

		align(destroyers, corvettes);

		cruisers.forEach((cruiser, index) => {
			const startY = Ship.corvetteParams().margin.y * Math.ceil(corvettes.length/corvettesInLine)
				+ Ship.destroyerParams().margin.y * Math.ceil(destroyers.length/corvettesInLine);
			
			if(index < cruisersInLine){
				cruiser.relCoords = {
					x: Ship.cruiserParams().margin.x * index,
					y: startY
				};
			}
			else{
				cruiser.relCoords = {
					x: Ship.cruiserParams().margin.x * (index - cruisersInLine),
					y: startY + Ship.cruiserParams().margin.y
				};
			}
		});
		
		align(cruisers, destroyers);
		defineFleetSize.call(this);
	}
	draw(ctx, sprites){
		ctx.translate(this._x, this._y);
		ctx.rotate(this._a);
		this._ships.forEach(ship => ship.draw(ctx, sprites));
		ctx.rotate(-this._a);
		ctx.translate(-this._x, -this._y);
	}
	localToGlobalCoords(canvas){
		this._ships.forEach(ship => {
			let cX = this._x;
			let cY = this._y;
			let a = this._a;
			let sin = Math.sin(a);
			let cos = Math.cos(a);
			let x = ship.relCoords.x + this._x;
			let y = ship.relCoords.y + this._y;

			let na = - a;
			let nx = Math.round((cos * (x - cX)) + (sin * (y - cY)) + cX + canvas.width/2);
			let ny = Math.round((cos * (y - cY)) - (sin * (x - cX)) + cY + canvas.height/2);

			ship.absCoords = {
				x: nx,
				y: ny,
				a: na
			};
		});
	}
	generateShips({
		corvettes: corvettes,
		destroyers: destroyers,
		cruisers: cruisers,
		battleships: battleships
	}){
		this._ships = [];
		for(let i = 0; i < corvettes; i++){
			this._ships.push(new Ship(Ship.randomName("corvette"), this._faction).corvette());
		}
		for(let i = 0; i < destroyers; i++){
			this._ships.push(new Ship(Ship.randomName("destroyer"), this._faction).destroyer());
		}
		for(let i = 0; i < cruisers; i++){
			this._ships.push(new Ship(Ship.randomName("cruiser"), this._faction).cruiser());
		}
		for(let i = 0; i < battleships; i++){
			this._ships.push(new Ship(Ship.randomName("cruiser"), this._faction).cruiser());
		}
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
		name: name,
		faction: faction,
		team: team,
		color: color,
		id: id
	}){
		let fleet = new Fleet(name, faction, color);
		fleet.team = team;
		for(let i = 0; i < corvettes; i++){
			fleet.ship = new Ship(Ship.randomName("corvette"), faction).corvette();
		}
		for(let i = 0; i < destroyers; i++){
			fleet.ship = new Ship(Ship.randomName("destroyer"), faction).destroyer();
		}
		for(let i = 0; i < cruisers; i++){
			fleet.ship = new Ship(Ship.randomName("cruiser"), faction).cruiser();
		}
		if(id){
			fleet._id = id;
		}
		return fleet;
	}
}
class Weapon{
	constructor(type = "laser", damage = {min: 30, max: 70}, hitChance = 1, cooldown = 2000){
		this._type = type;
		this._damage = damage;
		this._hitChance = hitChance;
		this._cooldown = cooldown;
		this._isReady = true;
	}
	hit(target){
		return Math.random() * this._hitChance > target.evace;
	}
	fire(target){
		this.reload();
		if(this.hit(target)){
			const COEF = 0.04;
			const damage = Math.random() * (this._damage.max - this._damage.min) + this._damage.min;

			target.damage = damage * COEF;
		}
		else
			return;
	}
	reload(){
		const self = this;
		this._ready = false;
		const id = setTimeout(() => {
			self._ready = true;
			console.log(`${self._type} fires`);
		}, this._cooldown);
		clearTimeout(id);
	}
	get isReady(){
		return this._isReady;
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
		this._target = null;
		this._fleet = null;
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
			x: 10,
			y: 10,
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
	set fleet(flt){
		this._fleet = flt;
	}
	set damage(amount){
		if(this._hp - amount <= 0){
			this._hp = 0;
			this._status = "destroyed";
		}
		else{
			this._hp -= amount;
		}
	}
	set relCoords({x: xCoord, y: yCoord}){
		this._relCoords.x = xCoord;
		this._relCoords.y = yCoord;
	}
	set absCoords({x: xCoord, y: yCoord, a: angle}){
		this._absCoords.x = xCoord;
		this._absCoords.y = yCoord;
		this._absCoords.a = angle;
	}
	think(game){
		if(this._status === "destroyed") return;
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
				this.fire(this._target);
				this._status = "firing";
			}
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
			console.log("idle");
			game.events.endFleetSim.try(game);
		}
		this.moveRad();
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
	defineEnemies(ships){
		this._enemyShips = ships.filter(ship => ship.fleet !== this._fleet);
	}
	searchEnemy(){

	}
	aim(){

	}
	fire(){
		this._weapons
			.filter(weapon => weapon.isReady)
			.forEach(weapon => weapon.fire(this._target));
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
		this._hp = 400;
		this._evace = 0.3;
		this._range = 50;
		this._maxSpeed = 30;
		this._weapons = [
			new Weapon("laser", {min: 20, max: 40}, 0.95, 3000),
			new Weapon("cinetic", {min: 20, max: 50}, 0.8, 3000)
		];
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
		this._hp = 800;
		this._evace = 0.2;
		this._range = 65;
		this._maxSpeed = 25;
		this._weapons = [
			new Weapon("laser", {min: 30, max: 50}, 0.95, 3100),
			new Weapon("cinetic", {min: 40, max: 70}, 0.8, 3500)
		];
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
		this._hp = 1400;
		this._evace = 0.15;
		this._range = 85;
		this._maxSpeed = 20;
		this._weapons = [
			new Weapon("laser", {min: 40, max: 60}, 0.95, 3300),
			new Weapon("cinetic", {min: 40, max: 70}, 0.8, 3500),
			new Weapon("cinetic", {min: 40, max: 70}, 0.8, 3500)
		];
		return this;
	}
	defineColor(){
		if(this._faction === "republican") return "blue";
		else if(this._faction === "imperial") return "red";
		else if(this._faction === "for state") return "grey";
		else if(this._faction === "pirates") return "black";
		else if(this._faction === "united humanity") return "violet";
		else return "blue";
	}
	draw(ctx, sprites){
		if(this._status === "destroyed") return;
		ctx.translate(this._absCoords.x, this._absCoords.y);
		ctx.rotate(this._absCoords.a);

		ctx.drawImage(sprites[this._class.name][this._color], 0, 0, this._class.size.x, this._class.size.y);

		ctx.rotate(-this._absCoords.a);
		ctx.translate(-this._absCoords.x, -this._absCoords.y);
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