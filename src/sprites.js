export default class Sprites{
	constructor(){
		this._corvette = null;
		this._destroyer = null;
		this._cruiser = null;
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

			[this._corvette, this._destroyer, this._cruiser].forEach(spriteCollection => {
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
}