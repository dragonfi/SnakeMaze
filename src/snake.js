// Requires: crafty.js
// Requires: utils.js
// Requires: kongregate.js

var Game = {
	cols: 16,
	rows: 9,
	statusLines: 1,
	tileSize: 20,
	borderSize: 5,
	cellDelay: 500,
}

Game.offset = Game.tileSize + Game.borderSize;
Game.w = Game.cols * Game.offset + Game.borderSize;
Game.h = (Game.rows + Game.statusLines) * Game.offset + Game.borderSize;

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
		Crafty.bind("SceneChange", function(data) {console.log(data.newScene)});
		Crafty.scene("SetUp");
	});
};
