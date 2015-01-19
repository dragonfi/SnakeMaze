function sceneFromLines(lines) {
	var createComponent = {
		"#": function(col, row) {
			Crafty.e("Wall").Wall(col, row);
		},
		">": function(col, row) {
			Crafty.e("Player1").Snake(col, row, "right", 1);
		},
		"o": function(col, row) {
			Crafty.e("PointItem, LengthIncrease").PointItem(col, row);
		},
		"s": function(col, row) {
			Crafty.e("PointItem, SpeedIncrease").PointItem(col, row);
		},
		" ": function(col, row) {},
	};
	lines.forEach(function(line, row) {
		line.split("").forEach(function(char, col) {
			if (char === " "){
				return;
			};
			createComponent[char](col, row);
		});
	});
	Crafty.e("Score");
};

Crafty.scene("SetUp", function() {
	Crafty.e("RestartOnSpace");
	Crafty.e("Delay").delay(function() {
		Crafty.scene("MainMenu");
	}, 1000);
});

Crafty.scene("Stage1", function() {
	Crafty.e("BorderWalls");
	var pi = Crafty.e("PointItem, Neumann, LengthIncrease").PointItem(6, 2)
	pi.attr("randomMask", [
		"#########################",
		"#                       #",
		"# >                     #",
		"#                       #",
		"#                       #",
		"# o o ooo o   o   ooo o #",
		"# o o o   o   o   o o o #",
		"# ooo ooo o   o   o o o #",
		"# o o o   o   o   o o   #",
		"# o o ooo ooo ooo ooo o #",
		"#                       #",
		"#                       #",
		"#                       #",
		"#                       #",
		"#########################",
	]);
	Crafty.e("Player1").Snake(2, 2, "right", 5);
	Crafty.e("Score");
	Crafty.e("Objective").Objective(
		"Play until it's visible",
		function() {return false;}
	).bind("NoFreeCellsLeft", function() {
		this.condition = function() {return true;}
	});
	// Bonus: show the whole text sans one cell (no snake overlap)
});

Crafty.scene("Stage3", function() {
	sceneFromLines([
		"#########################",
		"#                       #",
		"#>ooo o  o  o  o  o ooo #",
		"# o   oo o o o o o  o   #",
		"# ooo o oo ooo oo   ooo #",
		"#   o o  o o o o o  o   #",
		"# ooo o  o o o o  o ooo #",
		"# ##################### #",
		"#   o   o  o  ooo ooo   #",
		"#   oo oo o o   o o     #",
		"#   o o o ooo  o  ooo   #",
		"#   o   o o o o   o     #",
		"#   o   o o o ooo ooo   #",
		"#                       #",
		"#########################",
	]);
	Crafty.e("Objective").Objective(
		"Collect all point items",
		function(snake) {
			return Crafty("PointItem").length === 0;
		}
	);
	// Bonus: collect in the fastest was possible
});

Crafty.scene("Stage2", function() {
	sceneFromLines([
		"#########################",
		"#                       #",
		"# #   #oo# ssooo#   #oo #",
		"# #   #o # s o o## ##o  #",
		"# # # #oo# s o o# # #oo #",
		"# ## ##o # s o o#   #o  #",
		"# #   #oo##ssooo#   #oo #",
		"# >                     #",
		"#        ooo sss        #",
		"#         o  s s        #",
		"#         o  s s        #",
		"#         o  s s        #",
		"#         o  sss        #",
		"#                       #",
		"#########################",
	]);
	Crafty.e("Score");
	Crafty.e("Objective").Objective(
		"Collect all point items",
		function(snake) {
			return Crafty("PointItem").length === 0;
		}
	);
	// Bonus: collect all yellow at max speed
});

Crafty.scene("TwoPlayerMode", function() {
	Crafty.e("BorderWalls");
	Crafty.e("PointItem, Reappearing, LengthIncrease").randomMove();
	Crafty.e("PointItem, Reappearing, SpeedIncrease").randomMove();
	Crafty.e("PointItem, Reappearing, Decrease").randomMove();
	Crafty.e("Player1").Snake(1, 1, "right", 5);
	Crafty.e("Player2").Snake(Game.cols-2, Game.rows-2, "left", 5);
	Crafty.e("Objective").Objective(
		"Reach a score of 10 before the other player",
		function(snake) {
			return snake.score >= 10;
		}
	);
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
	Crafty.e("Player1").Snake(2, 4, "right", 5);
});

