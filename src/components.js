var Color = {
	black: "#000000",
	grey: "#cccccc",
	white: "#ffffff",
	yellow: "#ffff00",
	green: "#00ff00",
	blue: "#00ccff",
	red: "#ff0000",
};

Crafty.c("Cell", {
	init: function() {
		this.requires("2D, Canvas, Color, Tween, Delay");
		this.bind("ClearGame", this.clear);
	},
	Cell: function(col, row, parent) {
		this.col = col;
		this.row = row;
		this.parent = parent;
		this._orig_attrs = {
			x: this.col * Game.offset + Game.borderSize,
			y: this.row * Game.offset + Game.borderSize,
			w: Game.tileSize,
			h: Game.tileSize,
		};
		this._null_attrs = {
			x: this._orig_attrs.x + Game.tileSize / 2,
			y: this._orig_attrs.y + Game.tileSize / 2,
			w: 0,
			h: 0,
		};
		this.attr(this._orig_attrs).color(Color.black);
		this.attr(this._null_attrs).color(parent.color);
		this.tween(this._orig_attrs, Game.cellDelay);
		this.trigger("CellInitialized");
		this.addComponent("SolidCell");
		return this;
	},
	clear: function() {
		this.tween(this._null_attrs, Game.cellDelay);
		this.removeComponent("SolidCell");
		this.delay(function() {
			this.destroy();
		}, Game.cellDelay);
	},
});

Crafty.c("ActiveCell", {
	init: function() {
		this.requires("Cell");
		this.bind("CellInitialized", this.checkHits);
	},
	checkHits: function() {
		var allCells = Crafty("SolidCell").get();
		var otherCellsAtSameCoords = allCells.filter(function(c) {
			return this.col === c.col && this.row === c.row && this !== c;
		}.bind(this));
		var otherObjs = otherCellsAtSameCoords.map(function(cell) {
				return cell.parent;
		});
		this.parent.trigger("OnHit", otherObjs);
	},
});

Crafty.c("EmptyCellGetter", {
	_buckets: function() {
		var buckets = {};
		Crafty("Cell").get().forEach(function(cell) {
			var key = this._key(cell);
			if (!(key in buckets)) {
				buckets[key] = [];
			};
			buckets[key].push(cell);
		}.bind(this));
		return buckets;
	},
	_key: function(cell) {
		return "" + cell.col + "," + cell.row;
	},
	emptyCells: function() {
		var buckets = this._buckets();
		var emptyCells = [];
		for (var col = 0; col < Game.cols; col++) {
			for (var row = 0; row < Game.rows; row++) {
				var position = {col: col, row: row};
				if (!(this._key(position) in buckets)) {
					emptyCells.push(position);
				};
			};
		};
		return emptyCells;
	},
});

Crafty.c("Grid", {
	init: function() {
		this.requires("2D, Delay");
		this.cells = [];
	},
	createCell: function(col, row, parent) {
		var cell = Crafty.e("ActiveCell").Cell(col, row, parent);
		this.cells.push(cell);
	},
	clearCells: function() {
		for (var index in this.cells) {
			this.cells[index].clear();
		};
		this.cells = [];
	},
});

Crafty.c("PointItem", {
	init: function() {
		this.requires("Grid");
		this.color = Color.white;
		this.bind("PointItemEaten", function(args) {
			if (args.pointItem === this) {
				this.clearCells();
				this.destroy();
			};
		});
	},
	PointItem: function(col, row) {
		this.col = Math.floor(col);
		this.row = Math.floor(row);
		this.createCell(this.col, this.row, this);
		return this;
	},
});

Crafty.c("Reappearing", {
	init: function() {
		this.requires("EmptyCellGetter");
		this.bind("PointItemEaten", function(args) {
			if (args.pointItem === this) {
				var newPI = this.clone();
				newPI.attr("randomMask", this.randomMask).randomMove();
			};
		});
	},
	randomMove: function() {
		var validCells = this.emptyCells();
		if (this.randomMask !== undefined) {
			validCells = validCells.filter(function(coords) {
				return this.randomMask[coords.row].charAt(coords.col) === "o";
			}.bind(this));
		};
		var coords = Utils.rand.choice(validCells);
		if (coords === undefined) {
			Crafty.trigger("NoFreeCellsLeft");
			return;
		};
		this.col = coords.col;
		this.row = coords.row;
		this.createCell(this.col, this.row, this);
	},
});

Crafty.c("Neumann", {
	init: function() {
		this.requires("Reappearing");
		this.bind("PointItemEaten", function(args) {
			if (args.pointItem === this) {
				var pi = this.clone();
				pi.attr({randomMask: this.randomMask}).randomMove();
			};
		});
	},
});

Crafty.c("LengthIncrease", {
	init: function() {
		this.requires("PointItem, ScoreIncrease");
		this.color = Color.yellow;
	},
});

Crafty.c("SpeedIncrease", {
	init: function() {
		this.requires("PointItem, ScoreIncrease");
		this.color = Color.blue;
	},
});

Crafty.c("Decrease", {
	init: function() {
		this.requires("PointItem");
		this.color = Color.red;
	},
});

Crafty.c("Wall", {
	init: function() {
		this.requires("Grid");
		this.color = Color.grey;
	},
	Wall: function(col, row) {
		this.createCell(col, row, this);
	},
});

Crafty.c("BorderWalls", {
	init: function() {
		this.requires("Wall");
		this.createWalls();
	},
	_is_border_cell: function(col, row) {
		if (col === 0 || row === 0) {
			return true;
		};
		if (col === Game.cols - 1 || row === Game.rows - 1) {
			return true;
		};
		return false;
	},
	createWalls: function() {
		for (var col = 0; col < Game.cols; col++) {
			for (var row = 0; row < Game.rows; row++) {
				if (this._is_border_cell(col, row)) {
					this.createCell(col, row, this);
				};
			};
		};
	},
});

Crafty.c("Snake", {
	init: function() {
		this.requires("Grid");
		this.segments = [];
		this.score = 0;
		this.status = "playing";
		this._speed = 4.0;
		this.bind("OnHit", this.handleCollisions);
		this.bind("ClearGame", this.stopMovement);
		this.bind("GameOver", this.stopMovement);
	},
	Snake: function(col, row, dir, len) {
		this.attr({
			col: col,
			row: row,
			dir: dir,
			newDir: dir,
			maxLength: len,
		});
		this._addSegment(this.col, this.row);
		this.startMovement();
		return this;
	},
	speed: function(value) {
		if (value !== undefined && value > 0) {
			this._speed = value;
			this._recalculateMoveDelay();
		};
		return this._speed;
	},
	_recalculateMoveDelay: function() {
		var delay = Math.floor(1000 / this._speed);
		this.cancelDelay(this.moveSnake);
		this.delay(this.moveSnake, delay, -1);
	},
	startMovement: function() {
		this._recalculateMoveDelay();
	},
	stopMovement: function() {
		this.cancelDelay(this.moveSnake);
		Crafty.trigger("SnakeStopped", this);
	},
	handleCollisions: function(objs) {
		for (var index in objs) {
			this._handleCollision(objs[index]);
		};
	},
	_handleCollision: function(obj) {
		if (obj.has("PointItem")) {
			var event_data = {snake: this, pointItem: obj};
			if (obj.has("LengthIncrease")) {
				this.maxLength += 1;
				Crafty.trigger("LengthItemEaten", event_data);
			};
			if (obj.has("SpeedIncrease")) {
				this.speed(this.speed() + Game.speedDelta);
				Crafty.trigger("SpeedItemEaten", event_data);
			};
			if (obj.has("ScoreIncrease")) {
				this.score += 1;
			};
			if (obj.has("Decrease")) {
				this.speed(this.speed() - Game.speedDelta);
				this.maxLength -= 1;
				this.score -= 4;
				Crafty.trigger("BadItemEaten", event_data);
				if (this.maxLength < 1) {
					this.status = "lost";
					this.stopMovement();
				};
			};
			Crafty.trigger("PointItemEaten", event_data);
		} else if ((obj.has("Wall") || obj.has("Snake")) && !this.invincible) {
			this.status = "lost";
			this.stopMovement();
			Crafty.trigger("WallHit");
		};
		Crafty.trigger("SnakeChanged", this);
	},
	_addSegment: function(col, row) {
		this.segments.push({col: col, row: row});
		this.createCell(col, row, this);
		while (this.cells.length > this.maxLength) {
			var cell = this.cells.shift();
			cell.clear();
		};
	},
	moveSnake: function() {
		this.dir = this.newDir;
		var delta = this._directions[this.dir];
		this.col = Utils.mod(this.col + delta.col, Game.cols);
		this.row = Utils.mod(this.row + delta.row, Game.rows);
		this._addSegment(this.col, this.row);
		Crafty.trigger("SnakeMoved");
	},
	changeDirection: function(newDir) {
		if (this._opposite_direction[this.dir] === newDir) {
			return;
		};
		this.newDir = newDir;
	},
	_directions: {
		"right": {col: 1, row: 0},
		"left": {col: -1, row: 0},
		"up": {col: 0, row: -1},
		"down": {col: 0, row: 1},
	},
	_opposite_direction: {
		"left": "right",
		"right": "left",
		"up": "down",
		"down": "up",
	},
});

Crafty.c("Controls", {
	init: function() {
		this.requires("Keyboard");
		this.keymap = {};
		this.bind("KeyDown", this.handleKeyPress);
	},
	handleKeyPress: function() {
		for (var key in this.keymap) {
			if (this.isDown(key)) {
				this.keymap[key].call(this);
			};
		};
	},
	remove: function() {
		this.unbind("KeyDown");
	},
});

Crafty.c("Player1", {
	name: "Green",
	color: Color.green,
	init: function() {
		this.requires("Controls, Snake");
		this.keymap = {
			"UP_ARROW": this.changeDirection.bind(this, "up"),
			"DOWN_ARROW": this.changeDirection.bind(this, "down"),
			"LEFT_ARROW": this.changeDirection.bind(this, "left"),
			"RIGHT_ARROW": this.changeDirection.bind(this, "right"),
		};
	},
});

Crafty.c("Player2", {
	name: "Red",
	color: Color.red,
	init: function() {
		this.requires("Controls, Snake");
		this.keymap = {
			"W": this.changeDirection.bind(this, "up"),
			"S": this.changeDirection.bind(this, "down"),
			"A": this.changeDirection.bind(this, "left"),
			"D": this.changeDirection.bind(this, "right"),
		};
	},
});

Crafty.c("SceneChanger", {
	init: function() {
		this.requires("Delay");
		this.bind("SceneChange", this.handleSceneChange);
	},
	restartCurrentScene: function() {
		if (this.currentScene === undefined) {
			this.currentScene = Crafty._current;
		};
		this.changeScene(this.currentScene);
	},
	changeScene: function(name) {
		Crafty.trigger("ClearGame");
		this.delay(function() {
			Crafty.scene(name);
		}, Game.cellDelay);
	},
	handleSceneChange: function(data) {
		this.currentScene = data.newScene;
	},
});

Crafty.c("SceneChangeControls", {
	init: function() {
		this.requires("Controls, SceneChanger");
		this.requires("PrintSceneControlsOnGameOver");
		this.keymap = {
			"SPACE": this.handleSpacebar,
			"R": this.restartCurrentScene,
			"ESC": this.changeScene.bind(this, "MainMenu"),
			"M": this.changeScene.bind(this, "MainMenu"),
		};
	},
	handleSpacebar: function() {
		if (Crafty("Target").completed) {
			this.changeScene(this.nextScene());
		} else {
			this.restartCurrentScene();
		};
	},
	nextScene: function() {
		var next_index = this.scenes.indexOf(Crafty._current) + 1;
		if (next_index >= this.scenes.length) {
			return "MainMenu";
		};
		return this.scenes[next_index];
	},
});

Crafty.c("PrintSceneControlsOnGameOver", {
	color: Color.black,
	init: function() {
		this.bind("GameWon", this.printGameWonControls);
		this.bind("GameLost", this.printGameLostControls);
	},
	clearCells: function() {
		if (this.cells) {
			this.cells.forEach(function(cell) {
				cell.destroy();
			});
		};
		this.cells = [];
	},
	addTabulatedRow: function(row, text1, text2) {
		for (var i = 0; i < Game.cols; i++) {
			Crafty.e("Cell").attr("alpha", 0.5).Cell(i, row, this);
		};
		Crafty.e("TextCell").TextCell(0, row, 12, "right").text(text1);
		Crafty.e("TextCell").TextCell(13, row, 12, "left").text(text2);
	},
	printGameWonControls: function() {
		this.clearCells();
		this.addTabulatedRow(6, "Next Stage:", "SPACE");
		this.addTabulatedRow(7, "Retry Stage:", "R");
		this.addTabulatedRow(8, "Return to Menu:", "M, ESC");
	},
	printGameLostControls: function() {
		this.clearCells();
		this.addTabulatedRow(7, "Retry Stage:", "R, SPACE");
		this.addTabulatedRow(8, "Return to Menu:", "M, ESC");
	},
});

Crafty.c("TextCell", {
	init: function() {
		this.requires("2D, DOM, Text, Tween");
	},
	TextCell: function(col, row, width, align) {
		this.align = (align !== undefined) ? align : "left"; 
		this.col = col;
		this.row = row;
		if (width === undefined) {
			this.width = (Game.cols - col);
		} else {
			this.width = width;
		};
		this.attr({
			x: Game.borderSize + Game.offset * col + 2,
			y: Game.borderSize + Game.offset * row + 4,
			w: this.width * Game.offset - Game.borderSize - 2,
			h: Game.cellSize,
			alpha: 0,
		}).css({
			"text-align": this.align
		}).textFont({
			size: Game.cellSize,
			family: "Orbitron",
		}).textColor(Color.white);
		this.tween({alpha: 1}, Game.cellDelay);
		this.bind("ClearGame", this.clear);
		return this;
	},
	clear: function() {
		this.tween({alpha: 0}, Game.cellDelay);
	},
});

Crafty.c("StatusLine", {
	init: function() {
		this.requires("TextCell");
	},
	StatusLine: function(lineNumber) {
		this.TextCell(0, Game.rows + lineNumber, Game.cols);
		return this;
	},
});

Crafty.c("Score", {
	init: function() {
		this.requires("2D");
		this.lines = [
			this._snakeLine(0),
			this._snakeLine(1),
		]
		this.gameIsOver = false;
		this.bonusLine = Crafty.e("StatusLine").StatusLine(2);
		this.objectivesLine = Crafty.e("StatusLine").StatusLine(1);
		this.bind("SnakeChanged", this.updateScore);
		this.bind("ObjectiveChanged", this.updateObjective);
		this.bind("GameOver", this.handleGameOver);
		Crafty("Snake").get().forEach(function(snake) {
			Crafty.trigger("SnakeChanged", snake);
		});
		Crafty("Objective").get().forEach(function(o) {
			Crafty.trigger("ObjectiveChanged", o);
		});
	},
	_snakeLine: function(lineNumber) {
		var row = Game.rows + lineNumber;
		var length = 6;
		var snakeLine = [
			Crafty.e("TextCell").TextCell(0, row, length),
			Crafty.e("TextCell").TextCell(5, row, length),
			Crafty.e("TextCell").TextCell(10, row, length),
			Crafty.e("TextCell").TextCell(15, row, length),
			Crafty.e("TextCell").TextCell(20, row, length),
		];
		snakeLine.textColor = function(color) {
			for (var i = 0; i < this.length; i++) {
				this[i].textColor(color);
			};
		}
		return snakeLine;
	},
	_updateSnakeLine: function(line, snake) {
		var status = "";
		if (snake.status === "won") {
			status = " -- Won!";
			this.lines[line].textColor(Color.green);
		} else if (snake.status === "lost") {
			status = " -- Lost";
			this.lines[line].textColor(Color.red);
		};
		this.lines[line][0].text(snake.name + ":");
		this.lines[line][1].text("Score: " + snake.score);
		this.lines[line][2].text("Length: " + snake.maxLength);
		this.lines[line][3].text("Speed: " + snake.speed().toFixed(2));

		this.lines[line][4].text(status);
	},
	updateScore: function(snake) {
		if (snake.has("Player1")) {
			this._updateSnakeLine(0, snake);
		} else if (snake.has("Player2")) {
			this._updateSnakeLine(1, snake);
		};
	},
	updateObjective: function(objective) {
		if (objective.has("TwoPlayerTarget")) {
			this.colorLine(this.bonusLine, objective);
			this.bonusLine.text("Target: " + objective.text);
		} else if (objective.has("Target")) {
			this.colorLine(this.objectivesLine, objective);
			this.objectivesLine.text("Target: " + objective.text);
		} else if (objective.has("Bonus")) {
			this.colorLine(this.bonusLine, objective);
			this.bonusLine.text("Bonus: " + objective.text);
		};
	},
	colorLine: function(line, objective) {
		if (objective.completed) {
			line.textColor(Color.green);
		} else if (objective.failed) {
			line.textColor(Color.red);
		};
	},
	handleGameOver: function() {
		this.gameIsOver = true;
		var self = this;
		Crafty("Snake").get().forEach(function(snake){
			self.updateScore(snake);
		});
	},
});

Crafty.c("GameOverIfNoSnakesArePlaying", {
	init: function() {
		this.bind("EnterFrame", this.checkSnakesLost);
	},
	checkSnakesLost: function() {
		var noSnakesArePlaying = Crafty("Snake").get().every(function(snake){
			return snake.status !== "playing";
		});
		if (noSnakesArePlaying) {
			this.trigger("GameOver");
			this.unbind("EnterFrame");
		};
	},
});

Crafty.c("ObjectiveConditions", {
	eventFires: function(eventName) {
		this.uniqueBind(eventName, function() {
			this["_eventFired_" + eventName] = true;
		});
		return function() {
			if (this["_eventFired_" + eventName]) {
				this.unbind(eventName);
				return true;
			};
		};
	},
	countAtLeast: function(componentName, targetNumber) {
		return function() {
			var number = Crafty(componentName).length;
			this.updateText(number);
			return number >= targetNumber;
		};
	},
	countAtMost: function(componentName, targetNumber) {
		return function() {
			var number = Crafty(componentName).length;
			this.updateText(number);
			return number <= targetNumber;
		};
	},
	timerExpires: function(treshold) {
		this.firstFrame = Crafty.frame();
		return function() {
			var currentFrame = Crafty.frame() - this.firstFrame;
			var timeRemaining = treshold - currentFrame;
			this.updateText(timeRemaining);
			return timeRemaining <= 0;
		};
	},
});

Crafty.c("Objective", {
	init: function() {
		this.requires("2D, ObjectiveConditions, GameOverIfNoSnakesArePlaying");
		this.bind("EnterFrame", this.checkCompletion);
	},
	Objective: function(attrs) {
		this.textTemplate = attrs.text;
		this.text = attrs.text;
		this.winCondition = attrs.winCondition;
		this.loseCondition = attrs.loseCondition;
		this.checkCompletion();
		Crafty.trigger("ObjectiveChanged", this);
		return this;
	},
	checkCompletion: function() {
		if (this.winCondition()) {
			this.complete();
		} else if (this.loseCondition()) {
			this.fail();
		};
		Crafty.trigger("ObjectiveChanged", this);
	},
	updateText: function() {
		var text = this.textTemplate;
		for(var i = 0; i < arguments.length; i++) {
			text = text.replace("%s", arguments[i]);
		};
		this.text = text;
	},
	fail: function() {
		this.failed = true;
		this.unbind("EnterFrame");
		this.trigger("Failed");
		Crafty.trigger("ObjectiveChanged", this);
	},
	complete: function() {
		this.completed = true;
		this.unbind("EnterFrame");
		this.trigger("Completed");
		Crafty.trigger("ObjectiveChanged", this);
	},
});

Crafty.c("Bonus", {
	init: function() {
		this.requires("Objective");
		this.bind("Completed", this.handleCompletion);
	},
	handleCompletion: function() {
		Crafty.trigger("BonusObjectiveCompleted", this);
	},
});

Crafty.c("Target", {
	init: function() {
		this.requires("Objective");
		this.bind("Completed", this.triggerGameWon);
		this.bind("Failed", this.triggerGameLost);
	},
	triggerGameWon: function() {
		this.unbind("GameOver");
		Crafty.trigger("TargetObjectiveCompleted", this);
		Crafty.trigger("GameWon");
		Crafty.trigger("GameOver");
	},
	triggerGameLost: function() {
		this.unbind("GameOver");
		Crafty.trigger("TargetObjectiveFailed", this);
		Crafty.trigger("GameLost");
		Crafty.trigger("GameOver");
	},
});

Crafty.c("LogCompletion", {
	init: function() {
		this.bind("TargetObjectiveCompleted", this.handleTargetCompletion);
		this.bind("BonusObjectiveCompleted", this.handleBonusCompletion);
	},
	LogCompletion: function(menuEntries) {
		this.menuEntries = menuEntries;
	},
	getStageStatus: function(scene) {
		var completed = Crafty.storage(this._getTargetStorageKey(scene));
		var bonus = Crafty.storage(this._getBonusStorageKey(scene));
		return {completed: completed, bonusCompleted: bonus};
	},
	handleTargetCompletion: function() {
		this._handleCompletion(this._getTargetStorageKey(Crafty._current));
	},
	handleBonusCompletion: function() {
		this._handleCompletion(this._getBonusStorageKey(Crafty._current));
	},
	_handleCompletion: function(storageKey) {
		Crafty.storage(storageKey, true);
		window.kongregate.stats.submit(storageKey, 1);
	},
	_getBonusStorageKey: function(scene) {
		return this._getStorageKey(scene, "Bonus");
	},
	_getTargetStorageKey: function(scene) {
		return this._getStorageKey(scene, "");
	},
	_getStorageKey: function(scene, type) {
		return "Stage" + this._getIndex(scene) + type + "Completed";
	},
	_getIndex: function(name) {
		var index = this.menuEntries.indexOf(name);
		if (index === -1) {
			throw new Error("Stage not found: " + name);
		};
		return index + 1;
	}
});

Crafty.c("TwoPlayerTarget", {
	init: function() {
		this.requires("Objective");
		this.bind("Completed", this.triggerGameOver);
	},
	competeForPoints: function(target) {
		var p1 = Crafty("Player1");
		var p2 = Crafty("Player2");
		return function() {
			var p1won = (p1.score >= 10 && p1.status !== "lost");
			if (p1won) {
				p1.status = "won";
				p2.status = "lost";
			};
			var p2won = (p2.score >= 10 && p2.status !== "lost");
			if (p2won) {
				p2.status = "won";
				p1.status = "lost";
			};
			return p1won || p2won;
		};
	},
	triggerGameOver: function() {
		this.unbind("GameOver");
		Crafty.trigger("TwoPlayerObjectiveCompleted", this);
		Crafty.trigger("GameWon");
		Crafty.trigger("GameOver");
	},
});

Crafty.c("MenuPoints", {
	init: function() {
		this.requires("2D, SceneChanger");
		this.bind("PointItemEaten", this.handleSelection);
		this.cells = [];
	},
	MenuPoints: function(items) {
		this.clearCells();
		for (var i in items) {
			var col = items[i][0];
			var row = items[i][1];
			var text = items[i][3];
			var status = items[i][4];
			if (status === undefined) {status = {}};
			var prevItemStatus = (i > 0) ? items[i-1][4] : undefined;
			if (i === 0 || prevItemStatus === undefined) {
				status.locked = false;
			} else {
				status.locked = !(prevItemStatus.completed);
			};
			var pi = Crafty.e("PointItem, LengthIncrease");
			this._setStatus(pi, status);
			console.log(text, status.completed, status.locked, status.bonusCompleted, pi.color);
			pi.PointItem(col, row);
			if (items[i][2].constructor === String) {
				pi.scene = items[i][2];
			} else if (items[i][2].constructor === Array) {
				pi.menuEntries = items[i][2];
			} else {
				throw new Error("Expected menu entries or scene name");
			};
			var tc = Crafty.e("TextCell").TextCell(col + 1, row).text(text);
			this.cells.push(tc);
			this.cells.push.apply(this.cells, pi.cells);
		};
	},
	clearCells: function() {
		this.cells.forEach(function(c) {
			c.clear();
		});
		this.cells = [];
	},
	handleSelection: function(data) {
		if (data.pointItem.locked) {
			return;
		} else if (data.pointItem.back) {
			this.restartCurrentScene();
		} else if (data.pointItem.scene !== undefined) {
			this.changeScene(data.pointItem.scene);
		} else if (data.pointItem.menuEntries !== undefined) {
			this.clearCells();
			this.MenuPoints(data.pointItem.menuEntries);
			this.addResetItem();
		};
	},
	addResetItem: function() {
		var pi = Crafty.e("PointItem, LengthIncrease");
		pi.PointItem(13, 13);
		pi.back = true;
		var tc = Crafty.e("TextCell").TextCell(14, 13).text("Back");
		this.cells.push(tc);
		this.cells.push.apply(this.cells, pi.cells);
	},
	_setStatus: function(pi, status) {
		pi.locked = status.locked;
		if (status.locked) {
			pi.color = Color.grey;
		} else if (status.bonusCompleted) {
			pi.color = Color.blue;
		} else {
			pi.color = Color.yellow;
		};
	},
});

Crafty.c("Beeper", {
	init: function() {
		//TODO: Crafty has a bug where it creates a new resource
		//TODO: for each sound played. Not playing a sound for each
		//TODO: tick mitigates this problem to some degree.
		//this.bind("SnakeMoved", this.snakeMoveBeep);
		this.bind("BadItemEaten", this.badItemBeep);
		this.bind("SpeedItemEaten", this.goodItemBeep);
		this.bind("LengthItemEaten", this.goodItemBeep);
		this.bind("WallHit", this.badItemBeep);
	},
	snakeMoveBeep: function() {
		Crafty.audio.play("blip");
	},
	badItemBeep: function() {
		Crafty.audio.play("bloop");
	},
	goodItemBeep: function() {
		Crafty.audio.play("tik");
	},
});
