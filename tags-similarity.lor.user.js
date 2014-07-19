// ==UserScript==
// @name LOR tags similarity
// @description Схожесть интересов пользователя по тэгам для linux.org.ru.
// @author indvd00m <gotoindvdum [at] gmail [dot] com>
// @license Creative Commons Attribution 3.0 Unported
// @version 0.1.1
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

			var usersTags = {};
			var tagColor = null;

			var parseTags = function(nickname, fromContainer) {
				var favoriteTags = new Array();
				$('#bd :contains("Избранные теги")', fromContainer).nextUntil(':contains("Игнорированные теги")', '.tag').each(function() {
					favoriteTags.push($(this).text());
					if (tagColor == null)
						tagColor = $(this).css('color');
				});
				var ignoreTags = new Array();
				$('#bd :contains("Игнорированные теги")', fromContainer).nextAll('.tag').each(function() {
					ignoreTags.push($(this).text());
				});
				var tags = {
					favoriteTags: favoriteTags,
					ignoreTags: ignoreTags
				};
				usersTags[nickname] = tags;
			};

			var tagsLoaded = function(nicknamesArray) {
				return nicknamesArray.every(function(v,i) {
					return usersTags[v] !== undefined;
				});
			};

			var loadTags = function (nicknamesArray, callback) {
				var tryRunCallback = function() {
					if (tagsLoaded(nicknamesArray)) {
						if (callback != null)
							callback();
					}
				};
				nicknamesArray.forEach(function(nickname) {
					if (usersTags.hasOwnProperty(nickname)) {
						tryRunCallback();
					} else {
						var isProfilePage = nickname == $('.vcard .nickname').text();
						if (isProfilePage) {
							parseTags(nickname, $('body'));
						} else {
							var page = $("<div></div>");
							page.load('people/' + encodeURIComponent(nickname) + '/profile', function() {
								parseTags(nickname, page);
								tryRunCallback();
							});
						}
					}
				});
			};

			var getTagsSimilarity = function(nick1, nick2) {
				tags1 = usersTags[nick1];
				tags2 = usersTags[nick2];
				var favoriteIntersection = new Array();
				for (var i = 0; i < tags1.favoriteTags.length; i++) {
					var tag = tags1.favoriteTags[i];
					if (tags2.favoriteTags.indexOf(tag) !== -1) {
						favoriteIntersection.push(tag);
					}
				}
				var ignoreIntersection = new Array();
				for (var i = 0; i < tags1.ignoreTags.length; i++) {
					var tag = tags1.ignoreTags[i];
					if (tags2.favoriteTags.indexOf(tag) !== -1) {
						ignoreIntersection.push(tag);
					}
				}
				var similarity = (favoriteIntersection.length - ignoreIntersection.length) / tags1.favoriteTags.length;

				var similarityText = $('<span/>');
				if (ignoreIntersection.length > 0) {
					similarityText.append('(');
					similarityText.append($('<span>' + favoriteIntersection.length + '</span>').css('color', 'green').prop('title', favoriteIntersection.join(', ')));
					similarityText.append(' - ');
					similarityText.append($('<span>' + ignoreIntersection.length + '</span>').css('color', 'red').prop('title', ignoreIntersection.join(', ')));
					similarityText.append(') / ');
					similarityText.append($('<span>' + tags1.favoriteTags.length + '</span>').css('color', tagColor).prop('title', tags1.favoriteTags.join(', ')));
				} else {
					similarityText.append($('<span>' + favoriteIntersection.length + '</span>').css('color', 'green').prop('title', favoriteIntersection.join(', ')));
					similarityText.append(' / ');
					similarityText.append($('<span>' + tags1.favoriteTags.length + '</span>').css('color', tagColor).prop('title', tags1.favoriteTags.join(', ')));
				}

				var result = {
					similarity: similarity,
					similarityText: similarityText
				};
				return result;
			};

			var myLogin = $('#loginGreating > a:first').text();
			if (myLogin == null || myLogin.length == 0)
				return;

			var linkColor = $('#loginGreating > a:first').css('color');

			$('.vcard').each(function() {
				var vcard = $(this);
				var container = $(this).parents('#bd');
				var nickname = $('.vcard .nickname', container).text();
				if (nickname != myLogin) {
					loadTags([nickname, myLogin], function() {
						var myTags = usersTags[myLogin];
						$(':contains("Избранные теги")', container).nextUntil(':contains("Игнорированные теги")', '.tag').each(function() {
							var tag = $(this).text();
							if ($.inArray(tag, myTags.favoriteTags) != -1) {
								$(this).css('color', 'green');
							}
							if ($.inArray(tag, myTags.ignoreTags) != -1) {
								$(this).css('color', 'red');
							}
						});
						var similarity = getTagsSimilarity(myLogin, nickname);
						var element = $('<div/>');
						element.append($('<b>Совпадение тегов:</b>'));
						element.append(' ' + (similarity.similarity * 100).toFixed(2) + ' % [ ');
						element.append(similarity.similarityText);
						element.append(' ]');
						vcard.after(element);
					});
				}
			});

			$('.msg .sign').each(function() {
				var nickname = $("a[itemprop='creator']", $(this)).text();
				var link = $("<a href='javascript:void(0);'>Теги</a>");
				link.addClass('similarity');
				link.prop('title', 'Посчитать совпадение тегов');
				link.css('font-size', 'smaller');
				link.css('color', linkColor);
				link.click(function() {
					loadTags([nickname, myLogin], function() {
						var similarity = getTagsSimilarity(myLogin, nickname);
						var element = $('<span/>');
						element.prop('title', 'Совпадение тегов');
						element.css('font-size', 'smaller');
						element.append('Теги:');
						element.append(' ' + (similarity.similarity * 100).toFixed(2) + ' % [ ');
						element.append(similarity.similarityText);
						element.append(' ]');
						$('.msg .similarity').filter(function() {
							return nickname == $(this).prevAll("a[itemprop='creator']").text();
						}).replaceWith(element);
					});
				});
				var signMore = $('.sign_more', $(this));
				if (signMore.length) {
					signMore.before(' ');
					signMore.before(link);
				} else {
					$(this).append(' ');
					$(this).append(link);
				}
			});

		});

    }
})(window);

