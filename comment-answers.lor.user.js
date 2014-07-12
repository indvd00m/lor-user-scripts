// ==UserScript==
// @name LOR comment-answers
// @description Ответы на комментарии для linux.org.ru. Все страницы после текущей загружаются в фоне, что может увеличить трафик.
// @author indvd00m <gotoindvdum [at] gmail [dot] com>
// @license Creative Commons Attribution 3.0 Unported
// @version 0.7
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
			var defaultOpacity = 1;
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
				
				var comment = $('#comment-' + commentId);
				comment.addClass('readed');
				var commentText = $('.sign', comment).prevAll();

				commentText.prop('title', 'Прочитано: ' + readedDate);

				if (isDelay) {
					var length = commentText.text().length;
					var delay = length * multiplier;
					commentText.delay(delay).fadeTo('fast', opacity);
				} else {
					commentText.fadeTo('fast', opacity);
				}
			};

			var markCommentAsUnreaded = function (commentId, isDelay) {
				var key = keyPrefix + commentId;
				localStorage.removeItem(key);
				
				var comment = $('#comment-' + commentId);
				comment.removeClass('readed');
				var commentText = $('.sign', comment).prevAll();

				commentText.prop('title', '');

				if (isDelay) {
					var length = commentText.text().length;
					var delay = length * multiplier;
					commentText.delay(delay).fadeTo('fast', defaultOpacity);
				} else {
					commentText.fadeTo('fast', defaultOpacity);
				}
			};

			var toggleCommentAsReaded = function (commentId, isDelay) {
				var comment = $('#comment-' + commentId);
				if (comment.hasClass('readed')) {
					markCommentAsUnreaded(commentId, isDelay);
				} else {
					markCommentAsReaded(commentId, isDelay);
				}
			};

			$(".msg[id^='comment-']").each(function(index) {
				var commentId = $(this).prop("id").match(/comment-(\d+)/)[1];
				if (localStorage.getItem(keyPrefix + commentId)) {
					markCommentAsReaded(commentId);
				}

				var marker = $("<a href='javascript:void(0);'>Прочитано</a>");
				marker.prop('title', 'Отметить как прочитанное');
				marker.click(function() {
					toggleCommentAsReaded(commentId);
				});
				var container = $('<li/>');
				container.append(marker);
				$(".reply ul", $(this)).append(container);
			});

			var url = $(location).attr("href");
			if (/.*#comment-(\d+)/.test(url)) {
				var pageCommentId = url.match(/.*#comment-(\d+)/)[1];
				if (pageCommentId) {
					markCommentAsReaded(pageCommentId, true);
				}
			}
			url = url.replace(/#.*$/, "");

			var processReplyMessage = function (msgTitle, msgPageUrl, otherPage) {

				var replyUrl = $("a", msgTitle).prop("href");
				var replyCommentId = replyUrl.match(/.*[\?\&]?cid=(\d+).*/)[1];

				var nick = $("a[itemprop='creator']", msgTitle.next()).text();
				if (nick == null || nick == "")
					nick = "?";
				var commentId = msgTitle.parent().prop("id").match(/comment-(\d+)/)[1];
				var anchorName = "comment-" + commentId;

				msgTitle.click(function() {
					markCommentAsReaded(replyCommentId, true);
					markCommentAsReaded(commentId);
				});

				$("#comment-" + replyCommentId).each(function() {

					var href = msgPageUrl + "#" + anchorName;
					var link;
					if (otherPage) {
						link = $("<span>→<a href='" + href + "'>" + nick + "</a></span>");
						link.prop("title", "Комментарий расположен на другой странице");
						link.addClass("otherPage");
					} else {
						link = $("<span><a href='" + href + "'>" + nick + "</a></span>");
					}
					var answerClass = "answer";
					link.addClass(answerClass);
					link.prop("commentId", commentId);

					$("a", link).click(function() {
						markCommentAsReaded(replyCommentId);
						markCommentAsReaded(commentId, true);
					});

					var container = $(".reply", $(this));
					var answersClass = "answers";
					var answers = $("." + answersClass, container);
					if (!answers.length) {
						answers = $("<span class='" + answersClass + "'> Ответы: </span>");
						container.append(answers);
					}
					var divider = $("<span>, </span>");
					if (answers.children().length) {
						answers.append(divider.clone());
					}
					answers.append(link);
					// sorting by commentId
					if ($(".otherPage", answers).length) {
						var sortedLinks = $("." + answerClass, answers).toArray().sort(function (a1, a2) {
							var commentId1 = $(a1).prop("commentId");
							var commentId2 = $(a2).prop("commentId");
							return commentId1 - commentId2;
						});
						answers.children().remove();
						$.each(sortedLinks, function(index, value) {
							if (answers.children().length) {
								answers.append(divider.clone());
							}
							answers.append(value);
							$("a", value).click(function() {
								markCommentAsReaded(replyCommentId);
								markCommentAsReaded(commentId, true);
							});
						});
					}
				});
			}

			$(".title").has("a[data-samepage='samePage']").each(function(index) {
				processReplyMessage($(this), url);
			});

			// other pages loading
			$("strong.page-number", $("#comments")).nextAll("a.page-number").each(function() {
				var pageNumber = $(this).text();
				if (/\d+/.test(pageNumber)){
					var pageUrl = $(this).attr("href").replace(/#.*$/, "");
					var page = $("<div></div>");
					page.load(pageUrl, function() {
						$(".title", page).has("a[data-samepage!='samePage']").each(function() {
							processReplyMessage($(this), pageUrl, true);
						});
					});
				}	
			});

		});

    }
})(window);

