export default class Game{
	constructor(canvas){
		this._fleets = [];
		this._ships = [];
		this._canvas = canvas;
		this._context = canvas.getContext("2d");
		this._sprites = null;
		this._pause = true;
		this._events = {};
		this._options = {
			scale: 1,
			translateX: 0,
			translateY: 0
		};
		this._keyMap = {
			up: false,
			down: false,
			left: false,
			right: false
		};
	}
	set fleets(val){
		this._fleets = val;
	}
	set fleet(val){
		const newFleet = val;
		const alreadyHasIt = this._fleets.some(fleet=> fleet.id === newFleet.id);

		if(alreadyHasIt){
			console.log(`try to add ${newFleet.name} to game object while it already has it`);
			return false;
		}
		this._fleets.push(newFleet);
		return true;
	}
	set ships(val){
		this._ships = val;
	}
	set ship(val){
		const newShip = val;
		const alreadyHasIt = this._ships.some(ship => ship.id === newShip.id);

		if(alreadyHasIt){
			console.log(`try to add ${newShip.name} to game object while it already has it`);
			return false;
		}
		this._ships.push(newShip);
		return true;
	}
	set canvas(val){
		this._canvas = val;
	}
	set sprites(val){
		this._sprites = val;
	}
	set pause(val){
		this._pause = val;
	}
	set options(val){
		this._options = val;
	}
	set keyMap(val){
		this._keyMap = val;
	}
	get fleets(){
		return this._fleets;
	}
	get ships(){
		return this._ships;
	}
	get canvas(){
		return this._canvas;
	}
	get ctx(){
		return this._context;
	}
	get sprites(){
		return this._sprites;
	}
	get pause(){
		return this._pause;
	}
	get options(){
		return this._options;
	}
	get keyMap(){
		return this._keyMap;
	}
	get toStart(){
		return new Promise(resolve => {
			this.start = resolve;
		});
	}
	get events(){
		return this._events;
	}
	start(){
	}
	assignModifiers(text){
		console.log(text);
	}
}