$(document).ready(onDocumentReady)

let pluginType = null;
let pluginId = null;

function onDocumentReady() {
	if(window.location.search) {
		let urlParams = new URLSearchParams(window.location.search);
		let id = urlParams.get("id");
		if(id) {
			let type = urlParams.get("type");
			if(type) {
				pluginId = id;
				pluginType = type;
				setupDomPurify();
				createBackIcon(type);
				getDetailsForPlugin()
			} else {
				redirect404();
			}
		} else {
			redirect404();
		}
	} else {
		redirect404();
	}
}

function setupDomPurify() {
	DOMPurify.addHook("uponSanitizeElement", (node, data, config) => {
		if (data.tagName === "iframe") {
			const src = node.getAttribute("src") || "";
			if (!src.startsWith("https://www.youtube.com/embed/")) {
				return node.parentNode.removeChild(node);
			}
		} else if (data.tagName === "a") {
			let realHref = node.getAttribute("href") || "";
			if(node.host === location.host && !realHref.includes(location.host) && !realHref.startsWith("#")) {
				if(realHref.startsWith("/"))
					node.href = `https://github.com/${pluginId}/blob/master${realHref}`
				else
					node.href = `https://github.com/${pluginId}/blob/master/${realHref}`
			}
		}
	});
}

function redirect404() {
	window.location.replace(window.location.origin + "/404");
}

function createBackIcon(type) {
	let url;
	switch (type) {
		case "plugin":
			url = "/hub/plugins";
			break;
		case "mod":
			url = "/hub/mods";
			break;
		default:
			url = "/hub";
			break;
	}
	$("#open-logo").append(createIcon("/img/back.svg", "Back", url));
}

function getDetailsForPlugin() {
	$.get({
		url: "/plugins.json",
		success: onHubDataReceived,
		error: onRequestError,
		dataType: "json",
	});
}


function onHubDataReceived(data, textStatus, jqXHR) {
	let pluginData = null;
	let icon = null;
	let modifiedText = ""
	switch (pluginType) {
		case "plugin":
			pluginData = data["plugins"];
			$.get({
				url: `https://raw.githubusercontent.com/${pluginId}/master/README.md`,
				success: onReadmeReceived,
				error: onRequestError,
			});
			icon = createIcon("/img/github.svg", "GitHub", `https://github.com/${pluginId}`);
			modifiedText = "Updated ";
			break;
		case "mod":
			pluginData = data["mods"];
			icon = createIcon("/img/steam.svg", "GitHub", `https://steamcommunity.com/workshop/filedetails/?id=${pluginId}`);
			modifiedText = "Added "; // Mods get updates via steam, not the hub
			break;
		default:
			break;
	}

	if(pluginData) {
		pluginData = pluginData.find(x => x["id"] == pluginId);
		if(pluginData) {
			writeUi(pluginData, icon, modifiedText);
			return;
		}
	}

	console.error("Not found");
}

function createIcon(src, alt, url) {
	let link = document.createElement("a");
	link.href = url;
	let img = document.createElement("img");
	img.src = src;
	img.alt = alt;
	link.appendChild(img);
	return $(link);
}

function onReadmeReceived(data, textStatus, jqXHR) {
	let converter = new showdown.Converter();
	data = data.replace(/^\s*#.+/, ""); // Remove the title
	let html = converter.makeHtml(data);
	html = DOMPurify.sanitize(html, {
		ADD_TAGS: ["iframe"],
		ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
	});
	$("#plugin-desc").html(html);
}

function writeUi(pluginData, icon, modifiedText) {
	$("#plugin-name").text(pluginData["name"]);

	switch (pluginType) {
		case "plugin":
			document.title = "Plugin - " + pluginData["name"];
			break;
		case "mod":
			document.title = "Mod - " + pluginData["name"];
			break;
	}

	let desc = pluginData["description"];
	if(!desc)
		desc = pluginData["tooltip"];
	if(desc)
		$("#plugin-desc").html(escapeText(desc));

	let author = pluginData["author"];
	if(author)
		$("#plugin-author").text("By " + author);

	let unixTime = pluginData["modified"];
	if(Number.isInteger(unixTime)) {
		let date = new Date(unixTime * 1000);
		$("#plugin-date .tooltip-parent").text(modifiedText + ago(date));
		$("#plugin-date .tooltip").text(date.toLocaleString());
	}

	let logoBin = $("#open-logo");
	logoBin.append(icon);
	let filePath = pluginData["file"];
	if(filePath) {
		if(!filePath.startsWith("/"))
			filePath = "/" + filePath;
		filePath = filePath.replace("\\", "/");
		logoBin.append(createIcon("/img/edit.svg", "Edit", `https://github.com/sepluginloader/PluginHub/blob/main${filePath}`))
	}
}

function onRequestError(jqXHR, textStatus, errorThrown) {
	console.error(`Request error ${errorThrown}`);
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

/* 
NPM s-ago module 
https://github.com/sebastiansandqvist/s-ago
*/
function formatAgo(diff, divisor, unit, past, future, isInTheFuture) {
    var val = Math.round(Math.abs(diff) / divisor);
    if (isInTheFuture)
        return val <= 1 ? future : 'in ' + val + ' ' + unit + 's';
    return val <= 1 ? past : val + ' ' + unit + 's ago';
}
var agoUnits = [
    { max: 2760000, value: 60000, name: 'minute', past: 'a minute ago', future: 'in a minute' },
    { max: 72000000, value: 3600000, name: 'hour', past: 'an hour ago', future: 'in an hour' },
    { max: 518400000, value: 86400000, name: 'day', past: 'yesterday', future: 'tomorrow' },
    { max: 2419200000, value: 604800000, name: 'week', past: 'last week', future: 'in a week' },
    { max: 28512000000, value: 2592000000, name: 'month', past: 'last month', future: 'in a month' } // max: 11 months
];
function ago(date, max) {
    var diff = Date.now() - date.getTime();
    // less than a minute
    if (Math.abs(diff) < 60000)
        return 'just now';
    for (var i = 0; i < agoUnits.length; i++) {
        if (Math.abs(diff) < agoUnits[i].max || (max && agoUnits[i].name === max)) {
            return formatAgo(diff, agoUnits[i].value, agoUnits[i].name, agoUnits[i].past, agoUnits[i].future, diff < 0);
        }
    }
    // `year` is the final unit.
    // same as:
    //  {
    //    max: Infinity,
    //    value: 31536000000,
    //    name: 'year',
    //    past: 'last year'
    //  }
    return formatAgo(diff, 31536000000, 'year', 'last year', 'in a year', diff < 0);
};