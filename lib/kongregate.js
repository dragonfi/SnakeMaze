// Requires: http://www.kongregate.com/javascripts/kongregate_api.js
// Requires: crafty.js

Crafty.c("Kongregate", {
	init: function() {
	},
	bindStat: function(event, name) {
		if (name === undefined) {
			name = event;
		};
		this.bind(event, function(value) {
			if (value === undefined) {
				value = 1;
			};
			window.kongregate.stats.submit(name, value);
		});
		return this;
	},
});

var Kongregate = {
	initialized: false,
	init: function() {
		if (this.initialized === true) {
			return;
		};
		window.kongregateAPI.loadAPI(function() {
			window.kongregate = kongregateAPI.getAPI();
			this.initialized = true;
			console.log("Got kongregate api:", kongregate);
		});
		Crafty.e("Kongregate");
	},
};

Kongregate.dummyKongregate = {
	isDummyAPI: true,
	stats: {
		submit: function(name, value) {
			console.log("dummyKongregate.stats.submit:", name, value);
		},
	},
};

Kongregate.dummyAPI = {
	isDummyAPI: true,
	loadAPI: function(f) {
		f();
	},
	getAPI: function() {
		return Kongregate.dummyKongregate;
	},
};

if (window.kongregate === undefined) {
	window.kongregate = Kongregate.dummyKongregate;
};

if (window.kongregateAPI === undefined) {
	window.kongregateAPI = Kongregate.dummyAPI;
};
