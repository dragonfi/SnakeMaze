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
		"                         ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
		"  o o ooo o   o   ooo o  ",
		"  o o o   o   o   o o o  ",
		"  ooo ooo o   o   o o o  ",
		"  o o o   o   o   o o    ",
		"  o o ooo ooo ooo ooo o  ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
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
		"#     s  r              #",
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

Crafty.scene("Racetrack", function() {
	sceneFromLines([
		"#########################",
		"#               #       #",
		"#    s>s s s    #   s   #",
		"#  s         s  #  s s  #",
		"#   #########   #   #   #",
		"# s #       # s # s # s #",
		"#   #   s   #   #   #   #",
		"# s #  s s  #  s s  # s #",
		"#   #   #   #   s   #   #",
		"# s # s # s #       # s #",
		"#   #   #   #########   #",
		"#  s s  #  s         s  #",
		"#   s   #    s  s  s    #",
		"#       #               #",
		"#########################",
	]);
	Crafty.e("Score");
	Crafty("Snake").attr("maxLength", 5);
	Crafty.e("Target").Objective({
		text: "Collect all point items (%s remaining)",
		winCondition: Crafty("Target").countAtMost("PointItem", 0),
		loseCondition: Crafty("Target").eventFires("GameOver"),
	});
	Crafty.e("Bonus").Objective({
		text: "Before the timer runs out (%s remaining)",
		winCondition: Crafty("Bonus").eventFires("GameWon"),
		loseCondition: Crafty("Bonus").timerExpires(1200),
	});
});

Crafty.scene("Rooms", function() {
	sceneFromLines([
		"#########################",
		"#o                  o#oo#",
		"# ################## #  #",
		"# #o     o#o   o#    #  #",
		"# #o     o#o   o# #### ##",
		"# #### ###### ### #### ##",
		"#                       #",
		"#>     r  r  r  r  r  r #",
		"# #### ######## #### ####",
		"# #o       o#rr #ooo ooo#",
		"# #o#######o#rr #o     o#",
		"# #o       o#rr #o     o#",
		"# ############# #o     o#",
		"#o             o#ooooooo#",
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
		"    # # # # # # # # #    ",
		"##### # # # # # # # #####",
		"     o# # # # # # #o     ",
		"####### # # # # # #######",
		"       o# # # # #o       ",
		"######### # # # #########",
		"         o# # #o         ",
		"########### # ###########",
		"           o#o >         ",
		"    #################    ",
		"ss  #o     o#o o#o o#  ss",
		" s  # ##### # # # # #  s ",
		" s  # #o o# # # # # #  s ",
		"ss  # # # # # # # # #  ss",
		"    # # # # # # # # #    ",
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
		loseCondition: Crafty("Bonus").timerExpires(1500),
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

Crafty.scene("StillLife", function() {
	sceneFromLines([
		"                         ",
		" >                       ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
		"                         ",
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

Crafty.scene("ThankYou", function() {
	sceneFromLines([
		">oooooooooooooooooooooooo",
		"o                       o",
		"o                       o",
		"o                       o",
		"o                       o",
		"o                       o",
		"o                       o",
		"o                       o",
		"o                       o",
		"o                       o",
		"o                       o",
		"o                       o",
		"o                       o",
		"o                       o",
		"ooooooooooooooooooooooooo",
	]);
	Crafty.bind("PointItemEaten", function(attrs) {
		if (!attrs.pointItem.has("LengthIncrease")) {
			return;
		};
		for (var i = 0; i < 2; i++) {
			var textItem = Crafty.e("Reappearing, Decrease");
			textItem.attr("randomMask", [
				"                         ",
				"                         ",
				"  ooo o  o  o  o  o o o  ",
				"   o  o  o o o oo o oo   ",
				"   o  oooo ooo o oo o    ",
				"   o  o  o o o o  o oo   ",
				"   o  o  o o o o  o o o  ",
				"                         ",
				"      o o ooo o o o      ",
				"      o o o o o o o      ",
				"       o  o o o o o      ",
				"       o  o o o o        ",
				"       o  ooo ooo o      ",
				"                         ",
				"                         ",
			]).randomMove();
		};
	});
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

// Scene: Gliders (Still Life)
// Scene: Pac-Man
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
	function menuEntries() {
		function toDisplayedName(index, name) {
			return index + ": " + name.replace(/([A-Z])/g, " $1");
		};
		entries = [];
		for(var i=0; i<arguments.length; i++){
			var scene = arguments[i];
			entries.push([2, i*2 + 2, scene, toDisplayedName(i + 1, scene)]);
		};
		return entries;
	};
	one_player_stage_select = menuEntries(
		"Hello", "Welcome", "WithLove", "Racetrack",
		"Rooms", "Corridors", "ThankYou");
	Crafty.e("MenuPoints").MenuPoints([
		[12, 2, one_player_stage_select, "One Player Mode"],
		[12, 4, "TwoPlayerMode", "Two Player Mode"],
	]);
	Crafty.e("Player1").Snake(2, 2, "right", 5).invincible = true;
});
