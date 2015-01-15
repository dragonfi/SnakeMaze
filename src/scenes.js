Crafty.scene("SetUp", function() {
	Crafty.e("RestartOnSpace");
	Crafty.e("Delay").delay(function() {
		Crafty.scene("MainMenu");
	}, 1000);
});

Crafty.scene("OnePlayerMode", function() {
	Crafty.e("BorderWalls");
	Crafty.e("PointItem").PointItem(5, 4);
	Crafty.e("Player1").Snake(3, 4, "right", 5, "#00ff00");
	Crafty.e("Score");
});

Crafty.scene("TwoPlayerMode", function() {
	Crafty.e("BorderWalls");
	Crafty.e("PointItem").PointItem(Game.cols/2, Game.rows/2);
	Crafty.e("Player1").Snake(1, 1, "right", 5, "#00ff00");
	Crafty.e("Player2").Snake(Game.cols-2, Game.rows-2, "left", 5, "#ff0000");
	Crafty.e("Score");
});

Crafty.scene("MainMenu", function() {
	Crafty.e("BorderWalls");
	Crafty.e("MenuPoints").MenuPoints([
		[2, 2, "OnePlayerMode", "One Player Mode"],
		[2, 4, "TwoPlayerMode", "Two Player Cooperative"],
		[2, 6, "TwoPlayerMode", "Two Player Versus"]
	]);
	Crafty.e("Player1").Snake(10, 2, "left", 5, "#00ff00");
} );

