import toHTML from "./htmlTemplate.js";

export class Event{
	constructor({
		name: name = "",
		descr: descr = "",
		chance: chance = 1
	}){
		this._name = name;
		this._descr = descr;
		this._chance = chance;
		this._triggered = false;
		this._mayFire = false;
		this._options = [];
	}
	get triggered(){
		return this._triggered;
	}
	get html(){
		let options = "";
		this._options.forEach(option => {
			options = options.concat(`<div class="event-option" id="option-${option.id}">${option.name}</div>`);
		});
		let template = `
        <div class="event-tab">
			<div class="event-tab-header">
				<div class="header-name-container">
                	<h2>${this._name}</h2>
				</div>
				<div class="header-button-container">
					<div class="header-close-button"></div>
				</div>
            </div>
            <div class="event-tab-body">
                <div class="event-tab-img"></div>
                <div class="event-tab-descr">${this._descr}</div>
                <div class="event-tab-options-container">${options}</div>
            </div>
		</div>`;
		
		let node = toHTML(template);

		node.querySelectorAll(".event-option").forEach(option => {
			option.addEventListener("click", e => {
				let id = e.currentTarget.getAttribute("id");
				let option = this._options.find(option => id.includes(option.id));

				if(option){
					option.fire();
				}
				node.remove();
			});
		});
		node.querySelector(".header-close-button").addEventListener("click", e => {
			node.classList.add("hidden");
		});

		return node;
	}
	set option({name: name, descr: descr = "", callbacks: callbacks}){
		let option = new Option();

		option.name = name;
		option.descr = descr;
		callbacks.forEach(callback => option.callback = callback);

		this._options.push(option);
	}
	try(game){
		if(!this._triggered && Math.random() < this._chance){
			this.fire(game);
		}
	}
	fire(game){
		this._triggered = true;
		if(this._requirePause){
			game.pause = true;
		}
		game.container.appendChild(this.html);
	}
}
export class Modifier{
	constructor(func = (val => val)){
		//ship, weapon or whatever
		this._goal = "";
		this._function = func;
	}
	evaluate(val){
		return this._function(val);
	}
	get isModifier(){
		return true;
	}
}
class Option{
	constructor(){
		this._id = Math.random().toString(32).substr(2, 16);
		this._name = "";
		this._descr = "";
		this._callbacks = [];
	}
	get id(){
		return this._id;
	}
	get name(){
		return this._name;
	}
	get desrc(){
		return this._descr;
	}
	set name(val){
		this._name = val;
	}
	set descr(val){
		this._descr = val;
	}
	set callback(val){
		this._callbacks.push(val);
	}
	fire(){
		return this._callbacks
			.map(callback => callback())
			.filter(value => value && value.isModifier);
	}
}