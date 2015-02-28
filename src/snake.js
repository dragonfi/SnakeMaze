// Requires: crafty.js
// Requires: utils.js
// Requires: kongregate.js

var Game = {
	cols: 25,
	rows: 15,
	statusLines: 3,
	tileSize: 20,
	borderSize: 5,
	cellDelay: 500,
	speedDelta: 0.2,
};

Game.offset = Game.tileSize + Game.borderSize;
Game.w = Game.cols * Game.offset + Game.borderSize;
Game.h = (Game.rows + Game.statusLines) * Game.offset + Game.borderSize;

window.addEventListener("keydown", function(e) {
	// ESC, SPACE and ARROW KEYS
	if([27, 32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
		e.preventDefault();
	}
}, false);

window.onload = function() {
	console.log("Starting Snake On A Slow Display...");
	Crafty.init(Game.w, Game.h);
	Kongregate.init();
	Crafty.background("#000000");
	Crafty.paths({"audio": "assets/", "images": "assets/"});
	Crafty.load({
		"audio": {
			"blip": ["blip.wav"],
			"tik": ["tik.wav"],
			"bloop": ["bloop.wav"],
		},
	}, function() {
		Crafty.bind("SceneChange", function(data) {
			console.log(data.newScene);
		});
		Crafty.scene("SetUp");
	});
};
