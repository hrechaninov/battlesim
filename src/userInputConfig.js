import Worker from "worker-loader!./saveProcessor.worker.js";
import {factionColors} from "./factionColors.js";
import {Ship, Fleet} from "./ship.js";
import JSZip from "jszip";

export default class UserInputConfig{
	constructor(){
		this.getInputs();
		this.setEventListeners();
		
		this._chosenSide = null;
		this._chosenFleet = null;
		this._dialog = false;
		this._screens = [
			this._menuScreenBasic,
			this._menuScreenSides,
			this._menuScreenFleets
		];
		this._sidesColors = [
			"#d82727", //red
			"#2750d8", //blue
			"#27d859", //green
			"#44ffd0", //green2
			"#fcfc4e", //yellow
			"#333333" //grey
		];
		this._currentScreen = 0;
		this._basicConfig = new BasicGameConfig();
		this._conflictSides = [];
		this._fleets = [];
		this._applyConfig = () => null;

		this.addNeutralConflictSide();
		this.addColorInputs();

		//fake function for fleet testing
		//REMOVE AFTER TESTING
		// (function(){
		// 	this.addFleets([
		// 		{name: "fleet-1"},
		// 		{name: "fleet-2"},
		// 		{name: "fleet-3"},
		// 		{name: "fleet-4"},
		// 		{name: "fleet-5"},
		// 	]);
		// 	this._fleets.forEach(fleet => fleet.conflictSide = this._conflictSides[0]);
		// 	this._conflictSides.push(new ConflictSide("Usurpers", "red"));
		// 	this._conflictSides.push(new ConflictSide("Triumvirate", "blue"));
		// 	this.updateConflictSidesPicker();
		// }).apply(this);
	}
	applyConfig(){
		let fleets = [];
		let armies = [];
		if(this._fleets && this._fleets.length){
			fleets = this._fleets
				.filter(fleet => !fleet.conflictSide.isNeutral)
				.map(fleet => fleet.fleetObj);
		}
		if(this._armies && this._armies.length){
			armies = this._armies.map(army => army.fleetObj);
		}
		this._applyConfig({
			fleets: fleets,
			armies: this._armies
		});
	}
	finishConfig(){
		return new Promise(resolve => {
			this._applyConfig = resolve;
		});
	}
	readSaveFile(text){
		this._basicConfig.readSaveFile(text)
			.then(saveStr => {
				const saveObj = JSON.parse(saveStr);
				const stellFleets = [];
				const stellShips = saveObj.ships;
				const ships = [];
				const fleets = [];
				for(let index in saveObj.fleet){
					if(saveObj.fleet[index].owner === 0 && saveObj.fleet[index].fleet_template){
						stellFleets.push(saveObj.fleet[index]);
					}
				}
				stellFleets.forEach(fleet => {
					let currFleet = new Fleet(fleet.name);
					fleet.ships.forEach(id => {
						let currShip = new Ship(stellShips[id].name);
						let type = saveObj.ship_design[stellShips[id].ship_design].ship_size;
						if(type === "corvette"){
							currShip = currShip.corvette();
						}
						else if(type === "destroyer"){
							currShip = currShip.destroyer();
						}
						else if(type === "cruiser"){
							currShip = currShip.cruiser();
						}
						else if(type === "battleship"){
							currShip = currShip.battleship();
						}
						else if(type === "titan" || type === "npc_warship_01"){
							currShip = currShip.titan();
						}
						currFleet.ship = currShip;
						ships.push(currShip);
					});
					fleets.push(currFleet);
				});

				this._dropzone.querySelector(".dropzone-loading").classList.add("hidden-hard");
				this._dropzone.querySelector(".dropzone-success").classList.remove("hidden-hard");

				this.addFleets(fleets);
			})
			.catch(err => {
				console.log(err);
				this._dropzone.querySelector(".dropzone-loading").classList.add("hidden-hard");
				this._dropzone.querySelector(".dropzone-fail").classList.remove("hidden-hard");
			});
	}
	addColorInputs(){
		const getNode = color => {
			const template = document.createElement("template");

			template.innerHTML = `
				<div class="block-input" data-color="${color}" style="--color: ${color}"></div>
			`.trim();
			return template.content.firstChild;
		};

		this._sidesColors.forEach(color => {
			const node = getNode(color);
			node.addEventListener("click", this._eventListeners.sidesColorChoose);
			this._colorInput.append(node);
		});
	}
	addConflictSide(){
		const side = new ConflictSide();

		side.addNodeTo(this._conflictSidesContainer);
		side.name = this._sideNameInput.value;
		side.color = this._colorInput.querySelector(".chosen").dataset.color;
		side.element.addEventListener("click", this._eventListeners.showConflictDialog);
		this._conflictSides.push(side);
		this.updateConflictSidesPicker();
		this.updateFleetTabs();
	}
	editConflictSide(){
		const side = this._conflictSides.find(side => side.element === this._chosenSide);
		if(!side) return;
		side.name = this._sideNameInput.value;
		side.color = this._colorInput.querySelector(".chosen").dataset.color;
		this.updateConflictSidesPicker();
		this.updateFleetTabs();
	}
	deleteConflictSide(){
		if(!this._chosenSide) return;
		const index = this._conflictSides.findIndex(side => {
			return side.element === this._chosenSide;
		});
		const fleet = this._fleets.find(fleet => {
			return fleet.conflictSide === this._conflictSides[index];
		});

		if(fleet){
			const neutralSide = this._conflictSides
				.find(side => side.name.toLowerCase() === "нейтральная");
			console.log(this._conflictSides);
			fleet.conflictSide = neutralSide;
		}
		
		this._conflictSides.splice(index, 1);
		this._chosenSide.remove();
		this._chosenSide = null;
		console.log(this._conflictSides);
		this.updateConflictSidesPicker();
		this.updateFleetTabs();
	}
	updateConflictSidesPicker(){
		const getNode = side => {
			const template = document.createElement("template");
			let node = null;

			template.innerHTML = `
				<div class="block-input" data-side="${side.name}">${side.name}</div>
			`.trim();

			node = template.content.firstChild;
			node.addEventListener("click", this._eventListeners.fleetSideChoose);
			return node;
		};

		this._conflictSideInput.innerHTML = "";
		this._conflictSides
			.map(getNode)
			.forEach(node => this._conflictSideInput.append(node));
	}
	updateFleetTabs(){
		this._fleets.forEach(fleet => fleet.update());
	}
	addFleets(fleets){
		this._fleets = [];
		this._fleetsContainer.innerHTML = "";
		fleets.forEach(fleet => {
			const currFleet = new FleetConfig();
			const neutralSide = this._conflictSides.find(side => side.isNeutral);
			currFleet.fleetObj = fleet;
			currFleet.name = fleet.name;
			
			currFleet.addNodeTo(this._fleetsContainer);
			currFleet.conflictSide = neutralSide;
			currFleet.element.addEventListener("click", this._eventListeners.showFleetDialog);
			this._fleets.push(currFleet);
		});
	}
	editFleet(){
		const fleet = this._fleets.find(fleet => fleet.element === this._chosenFleet);
		const chosenSideName = this._conflictSideInput.querySelector(".chosen").dataset.side;

		if(!fleet) return;
		fleet.faction = this._factionInput.value;
		fleet.conflictSide = this._conflictSides
			.find(side => side.name.toLowerCase() === chosenSideName.toLowerCase());
		console.log(fleet);
	}
	basicInputsOk(){
		return this._basicConfig.saveObjReady;
	}
	sideInputsOk(){
		const hasName = this._sideNameInput.value.length;
		const hasColor = this._colorInput.querySelector(".chosen");

		if(hasName && hasColor)
			return true;
		else
			return false;
	}
	sidesConfigOk(){
		return this._conflictSides.filter(side => !side.isNeutral).length >= 2;
	}
	fleetInputsOk(){
		const hasFaction = this._factionInput.value.length;
		const hasConflictSide = this._conflictSideInput.querySelector(".chosen");

		if(hasFaction && hasConflictSide)
			return true;
		else
			return false;
	}
	fleetsConfigOk(){
		let atLeastOneFleetPerSide = false;
		let fleetsOnEachSide = this._conflictSides.map(side => {
			return {
				name: side.name,
				fleetsAmount: 0
			};
		});
		console.log(this._fleets);
		this._fleets.forEach(fleet => {
			const foundSideIndex = fleetsOnEachSide
				.findIndex(side => {
					if(side && side.name) 
						return side.name === fleet.conflictSide.name;
				});
			if(foundSideIndex >= 0){
				fleetsOnEachSide[foundSideIndex].fleetsAmount++;
			}
		});
		//inverted result of finding '0's in array
		atLeastOneFleetPerSide = !(fleetsOnEachSide
			.map(side => side.fleetsAmount)
			.includes(0));

		return atLeastOneFleetPerSide;
	}
	getInputs(){
		this._dropzone = document.querySelector(".dropzone");
		this._sideNameInput = document.querySelector("#side-name-input");
		this._conflictSideDialog = document.querySelector("#conflict-sides-dialog");
		this._colorInput = this._conflictSideDialog.querySelector(".block-inputs-container");
		this._factionInput = document.querySelector("#faction-name-input");
		this._fleetsDialog = document.querySelector("#fleets-dialog");
		this._conflictSideInput = this._fleetsDialog.querySelector(".block-inputs-container");

		this._menuScreenBasic = document.querySelector("#menu-screen-1");
		this._menuScreenSides = document.querySelector("#menu-screen-2");
		this._menuScreenFleets = document.querySelector("#menu-screen-3");

		this._conflictSidesContainer = this._menuScreenSides.querySelector(".tabs-container");
		this._fleetsContainer = this._menuScreenFleets.querySelector(".tabs-container");

		this._toNextScreenButtons = document.querySelectorAll(".arrow-right");
		this._toPrevScreenButtons = document.querySelectorAll(".arrow-left");

		this._conflictSideButtons = {
			ok: this._conflictSideDialog.querySelector(".dialog-button-ok"),
			cancel: this._conflictSideDialog.querySelector(".dialog-button-cancel"),
			delete: this._conflictSideDialog.querySelector(".dialog-button-delete")
		};
		this._fleetButtons = {
			ok: this._fleetsDialog.querySelector(".dialog-button-ok"),
			cancel: this._fleetsDialog.querySelector(".dialog-button-cancel")
		};
	}
	setEventListeners(){
		this._eventListeners = {};
		// game mode buttton click listener
		this._eventListeners.gameModeButtonClick = e => {
			[...e.currentTarget.children].forEach(child => {
				child.classList.toggle("chosen");
				child.classList.toggle("unchosen");
			});
		};

		document.querySelector("#game-mod-button")
			.addEventListener("click", this._eventListeners.gameModeButtonClick);	
		//save file dropzone listeners
		this._eventListeners.fileDrop = (e => {
			let zipLoader = new JSZip();
			
			zipLoader.loadAsync(e.dataTransfer.files[0])
				.then(zip => {
					return zip.file("gamestate").async("text");
				})
				.then(content => {
					this.readSaveFile(content);
				})
				.catch(err => {
					console.log(err);
					this._dropzone.querySelector(".dropzone-loading").classList.add("hidden-hard");
					this._dropzone.querySelector(".dropzone-fail").classList.remove("hidden-hard");
				});

			this._dropzone.querySelector(".dropzone-fail").classList.add("hidden-hard");
			this._dropzone.querySelector(".dropzone-success").classList.add("hidden-hard");
			this._dropzone.querySelector(".dropzone-waiting").classList.add("hidden-hard");
			this._dropzone.querySelector(".dropzone-loading").classList.remove("hidden-hard");
		}).bind(this);

		this._eventListeners.dragEnter = (e => {
			this._dropzone.classList.add("over");
		}).bind(this);
		this._eventListeners.dragLeave = (e => {
			this._dropzone.classList.remove("over");
		}).bind(this);

		["dragenter", "dragover", "dragleave", "drop"].forEach(event => {
			this._dropzone.addEventListener(event, e => {
				e.preventDefault();
				e.stopPropagation();
			});
		});
		this._dropzone.addEventListener("drop", this._eventListeners.fileDrop);
		this._dropzone.addEventListener("dragenter", this._eventListeners.dragEnter);
		this._dropzone.addEventListener("dragleave", this._eventListeners.dragLeave);
		//next-prev screens buttons listeners
		this._eventListeners.goToNextScreen = (e => {
			const currentScreen = this._screens[this._currentScreen];
			const nextScreen = this._screens[this._currentScreen+1];
			let inputsOk = false;

			if(this._dialog) return;

			if(currentScreen === this._menuScreenBasic){
				console.log("checking basic inputs");
				inputsOk = this.basicInputsOk();
			}
			else if(currentScreen === this._menuScreenSides){
				console.log("checking sides inputs");
				inputsOk = this.sidesConfigOk();
			}
			else if(currentScreen === this._menuScreenFleets){
				console.log("checking fleets inputs");
				inputsOk = this.fleetsConfigOk();
			}
			console.log("next screen: ", nextScreen);
			console.log("inputs OK: ", inputsOk);
			if(nextScreen && inputsOk){
				currentScreen.classList.toggle("hidden-hard");
				nextScreen.classList.toggle("hidden-hard");
				this._currentScreen++;
			}
			else if(!nextScreen && inputsOk){
				currentScreen.classList.toggle("hidden-hard");
				this.applyConfig();
			}
		}).bind(this);
		this._eventListeners.goToPrevScreen = (e => {
			const currentScreen = this._screens[this._currentScreen];
			const prevScreen = this._screens[this._currentScreen-1];
			console.log("click on previous screen button");

			if(this._dialog) return;

			console.log("previous screen: ", prevScreen);
			if(prevScreen){
				currentScreen.classList.toggle("hidden-hard");
				prevScreen.classList.toggle("hidden-hard");
				this._currentScreen--;
			}
		}).bind(this);

		this._toNextScreenButtons.forEach(button => {
			button.addEventListener("click", this._eventListeners.goToNextScreen);
		});
		this._toPrevScreenButtons.forEach(button => {
			button.addEventListener("click", this._eventListeners.goToPrevScreen);
		});
		//conflict sides dialog listeners
		this._eventListeners.showConflictDialog = (e => {
			const currentScreen = this._screens[this._currentScreen];

			if(this._dialog) return;
			//edit existing conflict side
			if(!e.currentTarget.classList.contains("required")){
				this._chosenSide = e.currentTarget;

				const side = this._conflictSides.find(side => side.element === this._chosenSide);

				if(!side) return;

				this._conflictSideDialog
					.querySelector(".dialog-title")
					.innerHTML = "Редактировать сторону";
				this._sideNameInput.value = side.name;
				this._conflictSideButtons.delete.classList.remove("hidden-soft");
				this._colorInput.querySelectorAll(".block-input").forEach(input => {
					if(input.dataset.color === side.color){
						input.classList.add("chosen");
					}
					else{
						input.classList.remove("chosen");
					}
				});
			}
			//create new conflict side
			else{
				this._conflictSideDialog
					.querySelector(".dialog-title")
					.innerHTML = "Создать сторону";
				this._sideNameInput.value = "";
				this._conflictSideButtons.delete.classList.add("hidden-soft");
				this._colorInput.querySelectorAll(".block-input").forEach(input => {
					input.classList.remove("chosen");
				});
			}
			this._colorInput.querySelectorAll(".block-input").forEach(input => {
				const usedColors = this._conflictSides.map(side => side.color);
				const currentColor = input.dataset.color;
				const side = this._conflictSides.find(side => side.element === this._chosenSide);
				let ownColor = null;

				if(side){
					ownColor = side.color;
				}
				if(usedColors.includes(currentColor) && currentColor !== ownColor){
					input.classList.add("hidden-hard");
				}
				else{
					input.classList.remove("hidden-hard");
				}
			});

			this._conflictSideDialog.classList.toggle("hidden-soft");
			currentScreen.classList.toggle("shadowed");
			currentScreen.classList.toggle("blured");
			this._dialog = true;
		}).bind(this);

		this._eventListeners.hideConflictDialog = (e => {
			const currentScreen = this._screens[this._currentScreen];

			this._chosenSide = null;
			this._conflictSideDialog.classList.toggle("hidden-soft");
			currentScreen.classList.toggle("shadowed");
			currentScreen.classList.toggle("blured");
			this._dialog = false;
		}).bind(this);

		this._eventListeners.okConflictDialog = e => {
			e.preventDefault();

			if(this.sideInputsOk()){
				if(this._chosenSide){
					this.editConflictSide();
				}
				else{
					this.addConflictSide();
				}
				this._eventListeners.hideConflictDialog();
			}
		};
		this._eventListeners.cancelConflictDialog = e => {
			e.preventDefault();
			
		};
		this._eventListeners.deleteConflictDialog = e => {
			e.preventDefault();
			this.deleteConflictSide();
		};
		this._eventListeners.sidesColorChoose = (e => {
			this._colorInput.querySelectorAll(".block-input").forEach(input => {
				input.classList.remove("chosen");
			});
			e.currentTarget.classList.add("chosen");
		}).bind(this);

		[...this._conflictSidesContainer.children].forEach(sideTab => {
			sideTab.addEventListener("click", this._eventListeners.showConflictDialog);
		});
		this._conflictSideButtons.ok
			.addEventListener("click", this._eventListeners.okConflictDialog);
		this._conflictSideButtons.cancel
			.addEventListener("click", this._eventListeners.cancelConflictDialog);
		this._conflictSideButtons.cancel
			.addEventListener("click", this._eventListeners.hideConflictDialog);
		this._conflictSideButtons.delete
			.addEventListener("click", this._eventListeners.deleteConflictDialog);
		this._conflictSideButtons.delete
			.addEventListener("click", this._eventListeners.hideConflictDialog);
		//fleets dialog listeners
		this._eventListeners.showFleetDialog = (e => {
			const currentScreen = this._screens[this._currentScreen];

			if(this._dialog) return;
			if(!e.currentTarget.classList.contains("required")){
				this._chosenFleet = e.currentTarget;
				const fleet = this._fleets.find(fleet => fleet.element === this._chosenFleet);
				const side = fleet.conflictSide || {name: "Нейтральная"};

				this._factionInput.value = fleet.faction;
				this._conflictSideInput
					.querySelectorAll(".block-input")
					.forEach(input => {
						if(input.dataset.side.toLowerCase() === side.name.toLowerCase()){
							input.classList.add("chosen");
						}
						else{
							input.classList.remove("chosen");
						}
					});
			}

			this._fleetsDialog.classList.toggle("hidden-soft");
			currentScreen.classList.toggle("shadowed");
			currentScreen.classList.toggle("blured");
			this._dialog = true;
		}).bind(this);

		this._eventListeners.hideFleetDialog = (e => {
			const currentScreen = this._screens[this._currentScreen];

			this._chosenFleet = null;
			this._fleetsDialog.classList.toggle("hidden-soft");
			currentScreen.classList.toggle("shadowed");
			currentScreen.classList.toggle("blured");
			this._dialog = false;
		}).bind(this);

		this._eventListeners.okFleetDialog = (e => {
			e.preventDefault();

			if(this.fleetInputsOk()){
				if(this._chosenFleet){
					this.editFleet();
				}
				this._eventListeners.hideFleetDialog();
			}
		}).bind(this);
		this._eventListeners.cancelConflictDialog = (e => {
			e.preventDefault();
		}).bind(this);

		this._eventListeners.fleetSideChoose = (e => {
			this._conflictSideInput.querySelectorAll(".block-input").forEach(input => {
				input.classList.remove("chosen");
			});
			e.currentTarget.classList.add("chosen");
		}).bind(this);

		this._fleetButtons.ok
			.addEventListener("click", this._eventListeners.okFleetDialog);
		this._fleetButtons.cancel
			.addEventListener("click", this._eventListeners.cancelConflictDialog);
		this._fleetButtons.cancel
			.addEventListener("click", this._eventListeners.hideFleetDialog);
	}
	addNeutralConflictSide(){
		const neutralSide = new ConflictSide("Нейтральная", "grey");
		neutralSide.isNeutral = true;
		this._conflictSides.push(neutralSide);
	}
}
class BasicGameConfig{
	constructor(){
		this._gameMod = "space";
		this._saveObjReady = false;
	}
	get mod(){
		return this._gameMod;
	}
	get fleets(){
		return this._saveObj.fleets || [];
	}
	get saveObjReady(){
		return this._saveObjReady;
	}
	set mod(val){
		this._gameMod = val;
	}
	readSaveFile(file){
		return new Promise((resolve, reject) => {
			const saveFileWorker = new Worker();
			saveFileWorker.postMessage(file);
			saveFileWorker.addEventListener("message", resp => {
				this._saveObjReady = true;
				resolve(resp.data);
			});
			saveFileWorker.addEventListener("error", e => {
				reject(e);
			});
		});
	}
	inputsOk(){
		return this._saveObjReady;
	}
	readInputs(){
		this._gameMod = document.querySelector("#game-mod-button .chosen").dataset.mode;
	}
}
class ConflictSide{
	constructor(name = "CONFLICT_SIDE_NAME", color = "#489d8a"){
		this._id = Math.random().toString(32).substr(2, 16);
		this._element = null;
		this._nameInput = document.querySelector("#side-name-input");
		this._colorInput = document.querySelector("#conflict-sides-dialog .block-inputs-container");
		this._name = name;
		this._color = color;
		this._isNeutral =false;
	}
	get node(){
		const template = document.createElement("template");
		template.innerHTML = `
			<div class="tab" style="--side-color: ${this._color}">
				<div class="tab-icon"></div>
				<div class="tab-name">${this._name}</div>
			</div>
		`.trim();
		return template.content.firstChild;
	}
	get color(){
		return this._color;
	}
	get name(){
		return this._name;
	}
	get element(){
		return this._element;
	}
	get isNeutral(){
		return this._isNeutral;
	}
	get id(){
		return this._id;
	}
	set name(str){
		this._name = str;
		this._element.querySelector(".tab-name").innerHTML = str;
	}
	set color(str){
		this._color = str;
		this._element.style.setProperty("--side-color", this._color);
	}
	set isNeutral(bool){
		this._isNeutral = bool;
	}
	addNodeTo(container){
		this._element = this.node;
		container.appendChild(this._element);
	}
}
class FleetConfig{
	constructor(){
		this._element = null;
		this._fleetObj = null;
		this._factionInput = document.querySelector("#faction-name-input");
		this._conflictSideInput = document.querySelector("#fleets-dialog .block-inputs-container");
		this._faction = "";
		this._conflictSide = null;
		this._name = "";
	}
	get node(){
		const template = document.createElement("template");
		let sideColor = "grey";
		let displayName = this._name;

		if(this._conflictSide){
			sideColor = this._conflictSide.color;
		}
		if(displayName.length > 16){
			displayName = displayName.slice(0, 15) + "...";
		}
		displayName = displayName.replace(/ /g, "&#160;");

		template.innerHTML = `
			<div class="tab" style="--side-color: ${sideColor}; --fleet-color: ${this.color}">
				<div class="tab-icon"></div>
				<div class="tab-name" title="${this._name}">${displayName}</div>
			</div>
		`.trim();
		return template.content.firstChild;
	}
	get faction(){
		return this._faction;
	}
	get conflictSide(){
		return this._conflictSide;
	}
	get color(){
		const defaultColor = "white";
		const factionColor = factionColors.get(this._faction.toLowerCase());

		return factionColor || defaultColor;
	}
	get name(){
		return this._name;
	}
	get element(){
		return this._element;
	}
	get fleetObj(){
		return this._fleetObj;
	}
	set faction(str){
		this._faction = str;
		this._element.style.setProperty("--fleet-color", this.color);
		this._fleetObj.faction = str;
		this._fleetObj.ships.forEach(ship => ship.faction = str);
	}
	set conflictSide(obj){
		this._conflictSide = obj;
		this._element.style.setProperty("--side-color", this._conflictSide.color);
		this._fleetObj.ships.forEach(ship => ship.sideId = obj.id);
		this._fleetObj.side = {
			name: obj.name,
			id: obj.id,
			color: obj.color
		};
	}
	set name(str){
		this._name = str;
	}
	set fleetObj(obj){
		this._fleetObj = obj;
	}
	addNodeTo(container){
		this._element = this.node;
		container.appendChild(this._element);
	}
	delete(){
		this._element.remove();
		this._element = null;
	}
	inputsOk(){
		const hasFaction = this._factionInput.value.length;
		const hasConflictSide = this._conflictSideInput.querySelector(".chosen");

		if(hasFaction && hasConflictSide)
			return true;
		else
			return false;
	}
	update(){
		if(this._conflictSide){
			this._element.style.setProperty("--side-color", this._conflictSide.color);
		}
	}
}