Crafty.scene("SetUp", function() {
	Crafty.e("RestartOnSpace");
	Crafty.e("Delay").delay(function() {
		Crafty.scene("MainMenu");
	}, 1000);
});

Crafty.scene("Stage1", function() {
	Crafty.e("BorderWalls");
	Crafty.e("PointItem, Reappearing, LengthIncrease").PointItem(5, 4);
	Crafty.e("Player1").Snake(3, 4, "right", 5, "#00ff00");
	Crafty.e("Score");
});

Crafty.scene("Stage2", function() {
	Crafty.e("BorderWalls");
	[[5, 4], [7, 4], [9, 4], [9, 6], [9, 8], [9, 10]].forEach(function(p) {
		var col = p[0];
		var row = p[1];
		Crafty.e("PointItem, Reappearing, LengthIncrease").PointItem(col, row);
	});
	Crafty.e("PointItem, Reappearing, LengthIncrease").PointItem(9, 12);
	Crafty.e("Player1").Snake(3, 4, "right", 5, "#00ff00");
	Crafty.e("Score");
});

Crafty.scene("Stage3", function() {
	Crafty.e("BorderWalls");
	Crafty.e("PointItem, Neumann, LengthIncrease").PointItem(8, 4);
	Crafty.e("PointItem, Neumann, SpeedIncrease").PointItem(10, 4);
	Crafty.e("Player1").Snake(3, 4, "right", 5, "#00ff00");
	Crafty.e("Score");
});

Crafty.scene("TwoPlayerMode", function() {
	Crafty.e("BorderWalls");
	var col = Game.cols / 2;
	var row = Game.rows / 2;
	Crafty.e("PointItem, Reappearing, LengthIncrease").PointItem(col, row);
	Crafty.e("PointItem, Reappearing, SpeedIncrease").PointItem(col, row - 1);
	Crafty.e("Player1").Snake(1, 1, "right", 5, "#00ff00");
	Crafty.e("Player2").Snake(Game.cols-2, Game.rows-2, "left", 5, "#ff0000");
	Crafty.e("Score");
});

Crafty.scene("MainMenu", function() {
	one_player_stage_select = [
		[2, 2, "Stage1", "Stage 1"],
		[2, 4, "Stage2", "Stage 2"],
		[2, 6, "Stage3", "Stage 3"],
	];
	Crafty.e("MenuPoints").MenuPoints([
		[12, 2, one_player_stage_select, "One Player Mode"],
		[12, 4, "TwoPlayerMode", "Two Player Mode"],
	]);
	Crafty.e("Player1").Snake(2, 2, "right", 5, "#00ff00");
});

