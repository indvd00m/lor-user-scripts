// ==UserScript==
// @name LOR comment-answers
// @description Ответы на комментарии для linux.org.ru. Все страницы после текущей загружаются в фоне, что может увеличить трафик.
// @author indvd00m <gotoindvdum [at] gmail [dot] com>
// @license Creative Commons Attribution 3.0 Unported
// @version 0.8.3
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
			var comment = $(this);
			var commentId = $(this).prop("id").match(/comment-(\d+)/)[1];
			if (localStorage.getItem(keyPrefix + commentId)) {
				markCommentAsReaded(commentId);
			}

			var markerComment = $("<a href='javascript:void(0);'>Прочитано</a>");
			markerComment.prop('title', 'Отметить как прочитанное');
			markerComment.click(function() {
				toggleCommentAsReaded(commentId);
			});
			var container = $('<li/>');
			container.append(markerComment);

			var markerTree = $("<a href='javascript:void(0);'>+ветка</a>");
			markerTree.prop('title', 'Отметить прочитанными всю ветку сообщений');
			markerTree.click(function() {
				var readed = comment.hasClass('readed');
				var markTreeAsReaded = function (commentId) {
					if (readed) {
						markCommentAsUnreaded(commentId);
					} else {
						markCommentAsReaded(commentId);
					}
					$('.' + answerClass, $(".msg[id='comment-" + commentId + "']")).each(function () {
						markTreeAsReaded($(this).attr('commentId'));
					});
				};
				markTreeAsReaded(commentId);
			});

			var container = $('<li/>');
			container.append(markerComment);
			container.append(' ');
			container.append(markerTree);
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

		var answerClass = "answer";

		var addMouseHandlers = function(link) {
			var commentId = link.closest('.' + answerClass).attr("commentId");
			var replyCommentId = link.closest('.' + answerClass).attr("replyCommentId");
			link.click(function() {
				markCommentAsReaded(replyCommentId);
				markCommentAsReaded(commentId, true);
			});
		};

		var prepareAnswerLink = function (link, level) {
			if (level == null)
				level = 1;
			var commentId = link.closest('.' + answerClass).attr("commentId");
			var popupClass = "popup";
			var out = function() {
				if (window.opera && window.opera.buildNumber) {
					$(this).data('hovering', false);
				}
				setTimeout(function () {
					if (window.opera && window.opera.buildNumber) {
						var cnt = 0;
						$("." + answerClass + ":not(.otherPage)").each(function () {
							if ($("a", $(this)).data('hovering'))
								cnt++;
						});
						if (cnt > 0)
							return;
					} else {
						if ($("." + answerClass + ":hover:not(.otherPage)").length > 0) {
							return;
						}
					}
						
					if (window.opera && window.opera.buildNumber) {
						var cnt = 0;
						$("." + popupClass).each(function () {
							if ($(this).data('hovering'))
								cnt++;
						});
						if (cnt == 0) {
							$("." + popupClass).remove();
						}
					} else {
						if ($("." + popupClass + ":hover").length == 0) {
							$("." + popupClass).remove();
						}
					}
				}, 500);
			};
			link.hover(
				function() {
					if (window.opera && window.opera.buildNumber) {
						$(this).data('hovering', true);
					}
					if (link.closest('.' + answerClass).hasClass('otherPage'))
						return;
					if ($('.' + popupClass + ' #comment-' + commentId).length)
						return;
					$("." + popupClass).each(function() {
						var popupLevel = $(this).attr('level');
						if (popupLevel >= level)
							$(this).remove();
					});
					var comment = $('#comment-' + commentId);
					var popup = $('<div></div>');
					popup.addClass(popupClass);
					popup.attr('level', level);
					popup.append(comment.clone(true));
					$('body').append(popup);
					popup.hover(function(){
						if (window.opera && window.opera.buildNumber) {
							$(this).data('hovering', true);
						}
					}, out);
					$('.' + answerClass + ' a', popup).each(function() {
						$(this).off();
						addMouseHandlers($(this));
						prepareAnswerLink($(this), level + 1);
					});

					popup.css('z-index', '10');
					popup.css('position', 'absolute');

					var padding = 5;
					var indent = 10 + level * 10;
					if (link.offset().left < $(window).width() / 2) {
						popup.css('right', indent + 'px');
						popup.css('width', ($(window).width() - link.offset().left - indent - padding * 2) + 'px');
					} else {
						popup.css('left', indent + 'px');
						popup.css('width', (link.offset().left + link.width() - indent - padding * 2) + 'px');
					}
					if (link.offset().top - $(window).scrollTop() < $(window).height() / 2) {
						popup.css('top', (link.offset().top + link.height() + indent) + 'px');
					} else {
						popup.css('top', (link.offset().top - popup.height() - link.height() - indent) + 'px');
					}

					popup.css('background-color', comment.css('background-color'));
					popup.css('box-shadow', '5px 5px 10px rgba(0,0,0,.4)');
					popup.css('border-radius', '5px');
					popup.css('border', 'solid 1px green');
					popup.css('padding', padding + 'px');
				}, out
			);
		};

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
				link.addClass(answerClass);
				link.attr("commentId", commentId);
				link.attr("replyCommentId", replyCommentId);

				addMouseHandlers($("a", link));
				prepareAnswerLink($("a", link));

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
						var commentId1 = $(a1).attr("commentId");
						var commentId2 = $(a2).attr("commentId");
						return commentId1 - commentId2;
					});
					answers.children().remove();
					$.each(sortedLinks, function(index, value) {
						if (answers.children().length) {
							answers.append(divider.clone());
						}
						answers.append(value);
						addMouseHandlers($("a", value));
						prepareAnswerLink($("a", value));
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

})(window);

