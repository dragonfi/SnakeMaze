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
		"r": function(col, row) {
			Crafty.e("PointItem, Decrease").PointItem(col, row);
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

Crafty.scene("Hello", function() {
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
	Crafty.e("Target").Objective({
		text: "Collect the yellow dots",
		winCondition: Crafty("Target").eventFires("NoFreeCellsLeft"),
		loseCondition: Crafty("Target").eventFires("GameOver"),
	});
	Crafty.e("Bonus").Objective({
		text: "Have at least 45 yellow dots on the sceen (%s/45)",
		winCondition: Crafty("Bonus").countAtLeast("LengthIncrease", 45),
		loseCondition: Crafty("Bonus").eventFires("GameOver"),
	});
});

Crafty.scene("Welcome", function() {
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
	Crafty.e("Target").Objective({
		text: "Collect all yellow dots (%s remaining)",
		winCondition: Crafty("Target").countAtMost("LengthIncrease", 0),
		loseCondition: Crafty("Target").eventFires("GameOver"),
	});
	Crafty.e("Bonus").Objective({
		text: "Finish before the timer runs out (%s remaining)",
		winCondition: Crafty("Bonus").eventFires("GameWon"),
		loseCondition: Crafty("Bonus").timerExpires(2600),
	});
});

Crafty.scene("DemoStage", function() {
	sceneFromLines([
		"#########################",
		"#>       o              #",
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
	Crafty.e("Target").Objective({
		text: "Collect all point items",
		winCondition: Crafty("Target").countAtMost("PointItem", 0),
		loseCondition: Crafty("Target").eventFires("GameOver"),
	});
	Crafty.e("Bonus").Objective({
		text: "Before the timer runs out %s",
		winCondition: Crafty("Bonus").eventFires("GameWon"),
		loseCondition: Crafty("Bonus").timerExpires(250),
	});
	// Bonus: collect all yellow at max speed
});

Crafty.scene("Rooms", function() {
	sceneFromLines([
		"#########################",
		"#o                  o#oo#",
		"# ################## #  #",
		"# #o     o#o   o#    #  #",
		"# #o     o#o   o# ####  #",
		"# #### ###### ### #### ##",
		"#                       #",
		"#>     r  r  r  r  r  r #",
		"# #### ######## #### ####",
		"# #o       o#rr #o     o#",
		"# #o       o#rr #o     o#",
		"# #o       o#rr #o     o#",
		"# ############# #o     o#",
		"#o             o#o     o#",
		"#########################",
	]);
	Crafty.e("Score");
	Crafty.e("Target").Objective({
		text: "Collect all yellow dots (%s remaining)",
		winCondition: Crafty("Target").countAtMost("LengthIncrease", 0),
		loseCondition: Crafty("Target").eventFires("GameOver"),
	});
	Crafty.e("Bonus").Objective({
		text: "Do not collect any red dots",
		winCondition: Crafty("Bonus").eventFires("GameWon"),
		loseCondition: Crafty("Bonus").eventFires("BadItemEaten"),
	});
});

Crafty.scene("Corridors", function() {
	sceneFromLines([
		"#########################",
		"#ooooooooooooooooooooooo#",
		"#o#####################o#",
		"#o#ooooo#ooooooo#ooooooo#",
		"#o#o###o#o#####o#o#######",
		"#o#o#ooo#ooo###o#ooooooo#",
		"#o#o#o#####o###o#######o#",
		"#>oooooooooooooooooooooo#",
		"#o#o#o#####o#o#o#o#######",
		"#o#o#ooooooo#o#o#o#ooooo#",
		"#o#o#########o#o#o#o###o#",
		"#o#ooooooooooo#o#o#ooo#o#",
		"#o#############o#o#####o#",
		"#ooooooooooooooo#ooooooo#",
		"#########################",
	]);
	Crafty.e("Score");
	Crafty.e("Target").Objective({
		text: "Collect all yellow dots (%s remaining)",
		winCondition: Crafty("Target").countAtMost("LengthIncrease", 0),
		loseCondition: Crafty("Target").eventFires("GameOver"),
	});
	Crafty.e("Bonus").Objective({
		text: "Before the timer runs out %s",
		winCondition: Crafty("Bonus").eventFires("GameWon"),
		loseCondition: Crafty("Bonus").timerExpires(2500),
	});
});

Crafty.scene("WithLove", function() {
	sceneFromLines([
		"                         ",
		"   o     o o ooo o o     ",
		"    o o o  o  o  ooo     ",
		"     o o   o  o  o o     ",
		"                         ",
		"       rrr   rrr         ",
		"      r   r r   r        ",
		"     r     r     r       ",
		"     r>          r       ",
		"     r           r       ",
		"      r         r        ",
		"       r       r         ",
		"        r     r          ",
		"         r   r           ",
		"          r r            ",
	]);
	Crafty.e("Score");
	Crafty.e("Target").Objective({
		text: "Collect all yellow dots (%s remaining)",
		winCondition: Crafty("Target").countAtMost("LengthIncrease", 0),
		loseCondition: Crafty("Target").eventFires("GameOver"),
	});
	Crafty.e("Bonus").Objective({
		text: "Do not collect any red dots",
		winCondition: Crafty("Bonus").eventFires("GameWon"),
		loseCondition: Crafty("Bonus").eventFires("BadItemEaten"),
	});
});

// Scene: Gliders
// Scene: Pac-Man
// Scene: Racetrack
// Scene: 1GAM

Crafty.scene("TwoPlayerMode", function() {
	Crafty.e("BorderWalls");
	Crafty.e("PointItem, Reappearing, LengthIncrease").randomMove();
	Crafty.e("PointItem, Reappearing, SpeedIncrease").randomMove();
	Crafty.e("PointItem, Reappearing, Decrease").randomMove();
	Crafty.e("Player1").Snake(1, 1, "right", 5);
	Crafty.e("Player2").Snake(Game.cols-2, Game.rows-2, "left", 5);
	Crafty.e("TwoPlayerTarget").Objective({
		text: "Reach a score of 10 before the other player",
		winCondition: Crafty("TwoPlayerTarget").competeForPoints(10),
		loseCondition: Crafty("TwoPlayerTarget").eventFires("GameOver"),
	});
	Crafty.e("Score");
});

Crafty.scene("MainMenu", function() {
	one_player_stage_select = [
		[2, 2, "Hello", "Stage 1"],
		[2, 4, "Welcome", "Stage 2"],
		[2, 6, "DemoStage", "Stage 3"],
		[2, 8, "Corridors", "Stage 4"],
		[2, 10, "WithLove", "Stage 5"],
		[2, 12, "Rooms", "Stage 6"],
	];
	Crafty.e("MenuPoints").MenuPoints([
		[12, 2, one_player_stage_select, "One Player Mode"],
		[12, 4, "TwoPlayerMode", "Two Player Mode"],
	]);
	Crafty.e("Player1").Snake(2, 2, "right", 5).invincible = true;
});
