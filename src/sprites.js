export default class Sprites{
	constructor(){
		this._corvette = null;
		this._destroyer = null;
		this._cruiser = null;
		this._battleship = null;
		this._titan = null;
		this._status = false;
	}
	loadSprites(){
		function spriteLoaded(image){
			return new Promise((resolve, reject) => {
				image.onload = resolve;
			});
		}
		return new Promise((resolve, reject) => {
			let allLoaded = [];
			this._corvette = {
				red: new Image(),
				blue: new Image(),
				violet: new Image(),
				grey: new Image(),
				black: new Image()
			};
			this._destroyer = {
				red: new Image(),
				blue: new Image(),
				violet: new Image(),
				grey: new Image(),
				black: new Image()
			};
			this._cruiser = {
				red: new Image(),
				blue: new Image(),
				violet: new Image(),
				grey: new Image(),
				black: new Image()
			};
			this._battleship = {
				red: new Image(),
				blue: new Image(),
				violet: new Image(),
				grey: new Image(),
				black: new Image()
			};
			this._titan = {
				red: new Image(),
				blue: new Image(),
				violet: new Image(),
				grey: new Image(),
				black: new Image()
			};

			this._corvette.red.src = "images/corvette_red.png";
			this._corvette.blue.src = "images/corvette_blue.png";
			this._corvette.violet.src = "images/corvette_violet.png";
			this._corvette.grey.src = "images/corvette_grey.png";
			this._corvette.black.src = "images/corvette_black.png";

			this._destroyer.red.src = "images/destroyer_red.png";
			this._destroyer.blue.src = "images/destroyer_blue.png";
			this._destroyer.violet.src = "images/destroyer_violet.png";
			this._destroyer.grey.src = "images/destroyer_grey.png";
			this._destroyer.black.src = "images/destroyer_black.png";

			this._cruiser.red.src = "images/cruiser_red.png";
			this._cruiser.blue.src = "images/cruiser_blue.png";
			this._cruiser.violet.src = "images/cruiser_violet.png";
			this._cruiser.grey.src = "images/cruiser_grey.png";
			this._cruiser.black.src = "images/cruiser_black.png";

			this._battleship.red.src = "images/battleship_red.png";
			this._battleship.blue.src = "images/battleship_blue.png";
			this._battleship.violet.src = "images/battleship_violet.png";
			this._battleship.grey.src = "images/battleship_grey.png";
			this._battleship.black.src = "images/battleship_black.png";

			this._titan.red.src = "images/titan_red.png";
			this._titan.blue.src = "images/titan_blue.png";
			this._titan.violet.src = "images/titan_violet.png";
			this._titan.grey.src = "images/titan_grey.png";
			this._titan.black.src = "images/titan_black.png";

			[
				this._corvette,
				this._destroyer,
				this._cruiser,
				this._battleship,
				this._titan
			].forEach(spriteCollection => {
				for(let sprite in spriteCollection){
					allLoaded.push(spriteLoaded(spriteCollection[sprite]));
				}
			});
			Promise.all(allLoaded).then(() => {
				this._status = true;
				resolve(this);
			});
		});
	}
	get ok(){
		return this._status;
	}
	get corvette(){
		return this._corvette;
	}
	get destroyer(){
		return this._destroyer;
	}
	get cruiser(){
		return this._cruiser;
	}
	get battleship(){
		return this._battleship;
	}
	get titan(){
		return this._titan;
	}
}