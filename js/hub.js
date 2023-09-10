let hubData = {};
let statsData = {};

let plugins = [];

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
		createPluginObject(plugins[key], listRoot);
	}

	listRoot = $("#client-mods");
	let mods = hubData["mods"];
	if(!mods)
		return;

	for (let key in mods) {
		createModObject(mods[key], listRoot);
	}
}

function createPluginObject(data, listRoot) {
	if(!data || !data["id"])
		return;

	let div = $(document.createElement("div"));
	div.addClass("plugin");
	div.addClass("tooltip-parent");
	
	if(!createListElements(data, div))
		return;

	listRoot.append(div);
}

function createModObject(data, listRoot) {
	if(!data || !data["id"])
		return;


	let div = $(document.createElement("a"));
	div.attr("href", "https://steamcommunity.com/sharedfiles/filedetails/?id=" + data["id"])
	div.addClass("plugin");
	div.addClass("tooltip-parent");
	
	if(!createListElements(data, div))
		return;

	listRoot.append(div);
}

function createListElements(data, div) {
	let pluginObject = {
		div: div,
		hidden: false,
	};

	if(data["name"]) {
		let name = $(document.createElement("div"));
		name.addClass("plugin-name");
		name.text(data["name"]);
		div.append(name);
		pluginObject.name = data["name"];
		pluginObject.nameUpper = pluginObject.name.toUpperCase();
	} else {
		return false;
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

	if(data["hidden"] === true) {
		div.addClass("hidden");
		pluginObject.hidden = true;
	}

	plugins.push(pluginObject);
	return true;
}

function onSearchEntered() {
	let search = $("#search-box").val();
	let filter = null;
	if(typeof search === "string")
		filter = search.toUpperCase().split(/ +/);
	for(let plugin in plugins)
		setHidden(filter, plugins[plugin]);
	console.log("Changed: ", filter);
}

function setHidden(search, plugin) {
	if(!search) {
		setPluginHidden(plugin, plugin.hidden); // No search terms
		return;
	}

	let searchValid = false;
	for (let i in search) {
		let filter = search[i];
		if(filter.length > 0) {
			if(!plugin.nameUpper.includes(filter)) {
				setPluginHidden(plugin, true); // Search does not match
				return;
			}
			searchValid = true;
		}
	}

	if(searchValid)
		setPluginHidden(plugin, false); // All search terms match
	else
		setPluginHidden(plugin, plugin.hidden); // No search terms
}

function setPluginHidden(plugin, hidden) {
	if(hidden)
		plugin.div.addClass("hidden");
	else
		plugin.div.removeClass("hidden");
}

// Text Escaping
const UrlRegex = /https?:\/\/(www\.)?[\w-.]{2,256}\.[a-z]{2,4}\b[\w-.@:%\+~#?&//=]*/g
const IllegalChars = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
	"\n": "<br>",
};

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