$(document).ready(function() {
	const PluginHubUrl = "/PluginHub/mods.json";
	$.get({
		url: PluginHubUrl,
		success: onHubDataReceived,
		error: onRequestError,
		dataType: "json",
	});
	$("#search-box").on("input", onSearchEntered);
})