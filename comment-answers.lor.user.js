// ==UserScript==
// @name LOR comment-answers
// @description Ответы на комментарии для linux.org.ru. Отображаются только те ответы, которые есть на текущей странице.
// @author indvd00m <gotoindvdum [at] gmail [dot] com>
// @license Creative Commons Attribution 3.0 Unported
// @version 0.4
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

			var url = $(location).attr("href").replace(/#.*$/, "");

			$(".title").has("a[data-samepage='samePage']").each(function(index) {

				var replyUrl = $("a", $(this)).prop("href");
				var replyMsgId = replyUrl.match(/.*[\?\&]?cid=(\d+).*/)[1];

				var nick = $("a[itemprop='creator']", $(this).next()).text();
				if (nick == null || nick == "")
					nick = "?";
				var msgId = $(this).parent().prop("id").match(/comment-(\d+)/)[1];
				var anchorName = "comment-" + msgId;

				$(this).click(function() {
					var replyMsgBody = $('.sign', $('#comment-' + replyMsgId)).prevAll();
					var lengthReplyMsgBody = replyMsgBody.text().length;
					replyMsgBody.delay(lengthReplyMsgBody * multiplier).fadeTo('fast', opacity);

					var msgBody = $('.sign', $('#comment-' + msgId)).prevAll();
					var lengthMsgBody = msgBody.text().length;
					msgBody.fadeTo('fast', opacity);
				});

				$("#comment-" + replyMsgId).each(function() {

					var href = url + "#" + anchorName;
					var link = $("<a href='" + href + "'>" + nick + "</a>");

					link.click(function() {
						var replyMsgBody = $('.sign', $('#comment-' + replyMsgId));
						var lengthReplyMsgBody = replyMsgBody.text().length;
						replyMsgBody.prevAll().fadeTo('fast', opacity);

						var msgBody = $('.sign', $('#comment-' + msgId)).prevAll();
						var lengthMsgBody = msgBody.text().length;
						msgBody.delay(lengthMsgBody * multiplier).fadeTo('fast', opacity);
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
		});

    }
})(window);

