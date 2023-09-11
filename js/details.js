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
				pluginType = type;;
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
		url: "/PluginHub/plugins.json",
		success: onHubDataReceived,
		error: onRequestError,
		dataType: "json",
	});
}


function onHubDataReceived(data, textStatus, jqXHR) {
	let pluginData = null;
	let icon = null;
	switch (pluginType) {
		case "plugin":
			pluginData = data["plugins"];
			$.get({
				url: `https://raw.githubusercontent.com/${pluginId}/master/README.md`,
				success: onReadmeReceived,
				error: onRequestError,
			});
			icon = createIcon("/img/github.svg", "GitHub", `https://github.com/${pluginId}`);
			break;
		case "mod":
			pluginData = data["mods"];
			icon = createIcon("/img/steam.svg", "GitHub", `https://steamcommunity.com/workshop/filedetails/?id=${pluginId}`);
			break;
		default:
			break;
	}

	if(pluginData) {
		pluginData = pluginData.find(x => x["id"] == pluginId);
		if(pluginData) {
			writeUi(pluginData, icon);
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

function writeUi(pluginData, icon) {
	$("#plugin-name").text(pluginData["name"]);
	let desc = pluginData["description"];
	if(!desc)
		desc = pluginData["tooltip"];
	if(desc)
		$("#plugin-desc").html(escapeText(desc));
	$("#open-logo").append(icon);
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