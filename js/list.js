let hubData = {};
let statsData = {};

let plugins = [];

$(document).ready(function() {
	$.get({
		url: "/plugins.json",
		success: onHubDataReceived,
		error: onRequestError,
		dataType: "json",
	});
});

function onHubDataReceived(data, textStatus, jqXHR) {
	const StatsUrl = "https://pluginstats.ferenczi.eu/stats";
	hubData = data;
	makeUi();
}

function onRequestError(jqXHR, textStatus, errorThrown) {
	console.error(`Request error ${errorThrown}`);
}

function makeUi() {
	if(!hubData)
		return;

	let dataType = "plugin";
	let listRoot = $("#plugin-list");
	let dataRoot;
	if(listRoot.length > 0) {
		dataRoot = hubData["plugins"];
	} else {
		listRoot = $("#client-mods");
		if(listRoot.length <= 0)
			return;
		dataType = "mod";
		dataRoot = hubData["mods"];
	}
	
	if(dataRoot) {
		let search = $("#search-box");
		search.on("input", onSearchEntered);

		plugins.sort(sortPlugins);
		for (let key in dataRoot) {
			createPluginObject(dataRoot[key], listRoot, dataType);
		}

		if(isFromDetails(dataType) || isPageRefresh()) {
			let storedSearch = sessionStorage.getItem("search");
			if(storedSearch) {
				search.val(storedSearch);
				onSearchEntered();
			}
		} else {
			sessionStorage.removeItem("search");
		}
	}

}

function isPageRefresh() {
	return performance.getEntriesByType("navigation").map(x => x.type).includes("reload");
}

function isFromDetails(pluginType) {
	return document.referrer.startsWith(location.origin + `/hub/details?type=${pluginType}`);
}

function createPluginObject(data, listRoot, type) {
	if(!data || !data["id"])
		return;

	let div = $(document.createElement("a"));
	div.attr("href", `/hub/details?type=${type}&id=${encodeURIComponent(data["id"])}`)
	div.addClass("plugin");
	
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
		name.addClass("tooltip-parent");
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
		author.addClass("tooltip-parent");
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
	sessionStorage.setItem("search", search);
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

function sortPlugins(a, b) {
	let aName = a["name"];
	if(!aName)
		return 0;
	let bName = b["name"];
	if(!bName)
		return 0;
	return ("" + aName).localeCompare(bName);
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