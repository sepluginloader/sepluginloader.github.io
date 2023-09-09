let hubData = {};
let statsData = {};

const UrlRegex = /https?:\/\/(www\.)?[\w-.]{2,256}\.[a-z]{2,4}\b[\w-.@:%\+~#?&//=]*/g
const IllegalChars = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
	"\n": "<br>",
};

function onHubDataReceived(data, textStatus, jqXHR) {
	const StatsUrl = "https://pluginstats.ferenczi.eu/stats";
	hubData = data;
	// TODO
	/*$.get({
		url: StatsUrl,
		success: onStatsDataReceived,
		error: onRequestError,
		dataType: "json",
	});*/
	makeUi();
}

function onStatsDataReceived(data, textStatus, jqXHR) {

}

function onRequestError(jqXHR, textStatus, errorThrown) {
	console.error(`Request error ${errorThrown}`);
}

function makeUi() {
	if(!hubData)
		return;

	let listRoot = $("#plugin-list");

	let plugins = hubData["plugins"];
	if(!plugins)
		return;

	for (let key in plugins) {
		createListObject(plugins[key], listRoot);
		console.log(key, plugins[key]);
	}
}

function createListObject(data, listRoot) {
	if(!data || data["hidden"] === true)
		return;

	let div = $(document.createElement("div"));
	div.addClass("plugin");
	div.addClass("tooltip-parent");

	if(data["name"]) {
		let name = $(document.createElement("div"));
		name.addClass("plugin-name");
		name.text(data["name"]);
		div.append(name);
	} else {
		return;
	}

	if(data["author"]) {
		let author = $(document.createElement("div"));
		author.addClass("plugin-author");
		author.text("By " + data["author"]);
		div.append(author);
	}

	let tooltip;
	if(data["tooltip"]) {
		tooltip = $(document.createElement("div"));
		tooltip.addClass("tooltip");
		tooltip.html(escapeHTML(data["tooltip"]));
		div.append(tooltip);
	}

	listRoot.append(div);
}

/**
	 * Process a string and make it usable as html
	 * @param {string} s The text to process
	 * @returns A string with all the invalid characters replaced
	 */
function escapeHTML(s) 
{
	return s.replace(/[&<>'"\n]/g, function(c) 
	{
		return IllegalChars[c];
	});
}

/**
 * Escapes HTML tags and adds links to the text.
 * @param {string} s The text to process
 */
function escapeText(s)
{
	let escapedText = "";
	let start = 0;
	for (const match of s.matchAll(UrlRegex)) 
	{
		if(match.index > start)
			escapedText += escapeHTML(s.substring(start, match.index));

		start = match.index + match[0].length;

		let url = escapeHTML(match[0]);
		escapedText += "<a href=\"" + url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + url + "</a>";
	}
	if(start == 0)
		return escapeHTML(s);

	if(start < s.length)
		escapedText += escapeHTML(s.substring(start));

	return escapedText;
}

$(document).ready(function() {
	const PluginHubUrl = "output.json";
	$.get({
		url: PluginHubUrl,
		success: onHubDataReceived,
		error: onRequestError,
		dataType: "json",
	});
})

