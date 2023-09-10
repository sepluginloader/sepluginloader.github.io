$(document).ready(function() {
	const PluginHubUrl = "/PluginHub/plugins.json";
	$.get({
		url: PluginHubUrl,
		success: onHubDataReceived,
		error: onRequestError,
		dataType: "json",
	});
	$("#search-box").on("input", onSearchEntered);
})