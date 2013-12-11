// ==UserScript==
// @name LOR comment-answers
// @description Ответы на комментарии для linux.org.ru. Отображаются только те ответы, которые есть на текущей странице.
// @author indvd00m <gotoindvdum [at] gmail [dot] com>
// @license Creative Commons Attribution 3.0 Unported
// @version 0.5
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

    if (/https?:\/\/(www\.)?linux.org.ru/.test(w.location.href)) {

		execute(function() {

			var opacity = 0.5;
			var multiplier = 50;
			var keyPrefix = 'comment-';

			var formatDate = function (date) {
				var y = date.getFullYear();
				var m = date.getMonth() + 1;
				var d = date.getDate();
				var h = date.getHours();
				var M = date.getMinutes();
				var s = date.getSeconds();

				if (m <= 9)
					m = '0' + m;
				if (d <= 9)
					d = '0' + d;
				if (h <= 9)
					h = '0' + h;
				if (M <= 9)
					M = '0' + M;
				if (s <= 9)
					s = '0' + s;

				return y + '-' + m + '-' + d + ' ' + h + ':' + M + ':' + s;
			};

			var markCommentAsReaded = function (commentId, isDelay) {
				var key = keyPrefix + commentId;
				var readedDate = localStorage.getItem(key);
				if (!readedDate) {
					readedDate = formatDate(new Date());
					localStorage.setItem(key, readedDate);
				}
				
				var commentText = $('.sign', $('#comment-' + commentId)).prevAll();

				commentText.prop('title', 'Прочитано: ' + readedDate);

				if (isDelay) {
					var length = commentText.text().length;
					var delay = length * multiplier;
					commentText.delay(delay).fadeTo('fast', opacity);
				} else {
					commentText.fadeTo('fast', opacity);
				}
			};

			var url = $(location).attr("href").replace(/#.*$/, "");

			$(".title").has("a[data-samepage='samePage']").each(function(index) {

				var replyUrl = $("a", $(this)).prop("href");
				var replyCommentId = replyUrl.match(/.*[\?\&]?cid=(\d+).*/)[1];

				var nick = $("a[itemprop='creator']", $(this).next()).text();
				if (nick == null || nick == "")
					nick = "?";
				var commentId = $(this).parent().prop("id").match(/comment-(\d+)/)[1];
				var anchorName = "comment-" + commentId;

				$(this).click(function() {
					markCommentAsReaded(replyCommentId, true);
					markCommentAsReaded(commentId);
				});

				$("#comment-" + replyCommentId).each(function() {

					var href = url + "#" + anchorName;
					var link = $("<a href='" + href + "'>" + nick + "</a>");

					link.click(function() {
						markCommentAsReaded(replyCommentId);
						markCommentAsReaded(commentId, true);
					});

					var container = $(".msg_body", $(this));
					var answersClass = "answers";
					var answers = $("." + answersClass, container);
					if (!answers.length) {
						answers = $("<div class='" + answersClass + "'>Ответы: </div>");
						answers.css("font-size", "smaller");
						container.append(answers);
					}
					if (answers.children().length) {
						answers.append(", ");
					}
					answers.append(link);
				});
			});


			$(".msg[id^='comment-']").each(function(index) {
				var commentId = $(this).prop("id").match(/comment-(\d+)/)[1];
				if (localStorage.getItem(keyPrefix + commentId)) {
					markCommentAsReaded(commentId);
				}
			});
		});

    }
})(window);

