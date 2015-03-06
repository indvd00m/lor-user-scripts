// ==UserScript==
// @name LOR always show deleted
// @description По возможности всегда показывать удалённые комментарии в темах на linux.org.ru. Как следствие - такие темы загружаются полностью, а не постранично.
// @author indvd00m <gotoindvdum [at] gmail [dot] com>
// @license Creative Commons Attribution 3.0 Unported
// @version 0.1.5
// @namespace http://www.linux.org.ru/*
// @namespace https://www.linux.org.ru/*
// @include http://www.linux.org.ru/*
// @include https://www.linux.org.ru/*
// ==/UserScript==

// running js-code in a page context 
var execute = function (body) {
	if(typeof body === "function") { body = "(" + body + ")();"; }
	var el = document.createElement("script");
	el.textContent = body;
	document.body.appendChild(el);
	return el;
};

(function (window, undefined) {
	var w;
	if (typeof unsafeWindow != "undefined") {
		w = unsafeWindow;
	} else {
		w = window;
	}

	if (w.self != w.top) {
		return;
	}

	execute(function() {

		$script.ready('jquery', function() {

			var csrf = $(':input[name="csrf"]:first').val();
			if (csrf == null) {
				csrf = localStorage.getItem('csrf');
			} else {
				localStorage.setItem('csrf', csrf);
			}

			var isNeedProcess = function(link) {
				if (link.closest('.answer:not(.otherPage)').length > 0)
					return false;
				if (link.attr('data-samepage') == 'samePage')
					return false;
				var href = link.attr('href');
				if (/\.\w+$/.test(href))
					return false;
				if (/^\D+$/.test(href))
					return false;
				return true;
			};

			var processLink = function(link) {
				var href = link.attr('href');
				var text = link.text();
				if (!isNeedProcess(link))
					return;
				link.prop('title', link.prop('title') + ' [Будут показаны удалённые комментарии]');
				link.click(function() {
					var form = $('<form/>');
					form.attr('action', href);
					form.attr('method', 'POST');
					form.append($('<input name="csrf" value="' + csrf + '">'));
					form.append($('<input name="deleted" value="1">'));
					$('body').append(form);
					form.submit();
					return false;
				});
			};

			if (csrf != null) {
				$('a[href*="forum"]').each(function() {
					processLink($(this));
				});
				$('a[href*="news"]').each(function() {
					processLink($(this));
				});
				$('a[href*="gallery"]').each(function() {
					processLink($(this));
				});
				$('a[href*="polls"]').each(function() {
					processLink($(this));
				});
			}

		});

	});

})(window);

