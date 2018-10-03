export default function toHTML(str){
	let template = document.createElement("template");
	template.innerHTML = str.trim();
	let node = [...template.content.childNodes].filter(node => node.nodeName !== "#text");
    
	if(node.length === 1){
		return node[0];
	}
	else{
		return node;
	}
}