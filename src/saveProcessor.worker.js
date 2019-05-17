import Jomini from "jomini";

self.addEventListener("message", e => {
	try{
		//replaces double quotes to prevent parser errors
		const saveObj = getSaveObj(e.data.replace(/\\"/g, "'"));
		postMessage(JSON.stringify(saveObj));
	}
	catch(err){
		console.log(err.message);
	}
	finally{
		close();
	}
});

function getSaveObj(data){
	const startTime = performance.now();
	const save = Jomini.parse(data);
	const finishTime = performance.now();
	const usedTime = (finishTime - startTime)/1000;
	console.log(`parsed save file in ${Math.round(usedTime * 100)/100} seconds`);
	return save;
}