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
	Crafty.e("Target").Objective(
		"Collect the yellow dots",
		function() {}
	).bind("NoFreeCellsLeft", function() {
		this.condition = this.complete
	});
	Crafty.e("Bonus").Objective(
		"Have at least 45 yellow dots on the sceen (%s/%s)",
		function() {
			var numberOfPoints = Crafty("LengthIncrease").length;
			this.updateText(numberOfPoints, 45);
			if (numberOfPoints >= 45) {
				this.complete();
			};
		}
	);
});

Crafty.scene("Stage2", function() {
	sceneFromLines([
		"#########################",
		"#>                      #",
		"# ooo o  o  o  o  o ooo #",
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
	var label = Crafty.e("TextCell, Delay").TextCell(0, 1, 25, "center");
	label.text("Welcome To");
	label.delay(label.clear, 10000);
	Crafty.e("Target").Objective(
		"Collect all yellow dots (%s remaining)",
		function(snake) {
			var dotsLeft = Crafty("LengthIncrease").length;
			this.updateText(dotsLeft);
			return dotsLeft === 0;
		}
	);
	Crafty.e("Bonus").Objective(
		"Finish before the timer runs out (%s remaining)",
		function() {
			var treshold = 2600;
			var frame = Crafty.frame() - this.startingFrame;
			var timeRemaining = treshold - frame;
			this.updateText(timeRemaining)
			if (timeRemaining <= 0) {
				this.fail();
			} else if (Crafty("Target").completed) {
				this.complete();
			};
		}
	).startingFrame = Crafty.frame();
});

Crafty.scene("Stage3", function() {
	sceneFromLines([
		"#########################",
		"#>                      #",
		"#                       #",
		"#                       #",
		"#                       #",
		"#                       #",
		"#                       #",
		"#                       #",
		"#                       #",
		"#                       #",
		"#                       #",
		"#                       #",
		"#                       #",
		"#                       #",
		"#########################",
	]);
	Crafty.e("Score");
	Crafty.e("Target").Objective(
		"Collect all point items",
		function() {
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
	Crafty.e("TwoPlayerTarget").Objective(
		"Reach a score of 10 before the other player",
		function() {
			var p1 = Crafty("Player1");
			var p2 = Crafty("Player2");
			if (p1.score >= 10 && p1.status !== "lost") {
				console.log("P1 won");
				p1.status = "won";
				p2.status = "lost";
				this.complete();
			};
			if (p2.score >= 10 && p2.status !== "lost") {
				p2.status = "won";
				p1.status = "lost";
				this.complete();
			};
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
	Crafty.e("Player1").Snake(2, 2, "right", 5);
});
