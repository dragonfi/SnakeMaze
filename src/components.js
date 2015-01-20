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
		this.attr(this._orig_attrs).color("#000000");
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
		this.color = "#ffffff";
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
			Crafty.trigger("GameOver");
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
		this.color = "#ffff00";
	},
});

Crafty.c("SpeedIncrease", {
	init: function() {
		this.requires("PointItem, ScoreIncrease");
		this.color = "#0000ff";
	},
});

Crafty.c("Decrease", {
	init: function() {
		this.requires("PointItem");
		this.color = "#ff0000";
	},
});

Crafty.c("Wall", {
	init: function() {
		this.requires("Grid");
		this.color = "#aaaaaa";
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
		if (value !== undefined) {
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
			if (obj.has("LengthIncrease")) {
				this.maxLength += 1;
			};
			if (obj.has("SpeedIncrease")) {
				this.speed(this.speed() + Game.speedDelta);
			};
			if (obj.has("ScoreIncrease")) {
				this.score += 1;
			};
			if (obj.has("Decrease")) {
				this.speed(this.speed() - Game.speedDelta);
				this.maxLength -= 1;
				this.score -= 4;
				if (this.maxLength < 1) {
					this.status = "lost";
					this.stopMovement();
				};
			};
			Crafty.trigger("PointItemEaten", {snake: this, pointItem: obj});
		} else if (obj.has("Wall") || obj.has("Snake")) {
			this.status = "lost";
			this.stopMovement();
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
});

Crafty.c("Player1", {
	name: "Green",
	color: "#00ff00",
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
	color: "#ff0000",
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
	},
	restartCurrentScene: function() {
		this.changeScene(this.currentScene);
	},
	changeScene: function(name) {
		Crafty.trigger("ClearGame");
		this.delay(function() {
			Crafty.scene(name);
		}, Game.cellDelay);
	},
});

Crafty.c("RestartOnSpace", {
	init: function() {
		this.requires("Controls, SceneChanger");
		this.keymap = {
			"SPACE": this.restartCurrentScene,
			"ESC": this.changeScene.bind(this, "MainMenu"),
			"M": this.changeScene.bind(this, "MainMenu"),
		};
		this._currentScene = undefined;
		this.bind("SceneChange", this.handleSceneChange);
	},
	handleSceneChange: function(data) {
		this.currentScene = data.newScene;
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
		this.width = width;
		this.attr({
			x: Game.borderSize + Game.offset * col + 2,
			y: Game.borderSize + Game.offset * row + 4,
			w: (Game.cols - col) * Game.offset - Game.borderSize - 2,
			h: Game.cellSize,
			alpha: 0,
		}).css({
			"text-align": this.align
		}).textFont({
			size: Game.cellSize,
			family: "Orbitron",
		}).textColor("#ffffff");
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
			this.lines[line].textColor("#00ff00");
		} else if (snake.status === "lost") {
			status = " -- Lost";
			this.lines[line].textColor("#ff0000");
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
			if (objective.completed) {this.bonusLine.textColor("#00ff00")};
			this.bonusLine.text("Target: " + objective.text);
		} else if (objective.has("Target")) {
			if (objective.completed) {this.objectivesLine.textColor("#00ff00")};
			this.objectivesLine.text("Target: " + objective.text);
		} else if (objective.has("Bonus")) {
			if (objective.completed) {this.bonusLine.textColor("#00ff00")};
			this.bonusLine.text("Bonus: " + objective.text);
		};
	},
	handleGameOver: function() {
		this.gameIsOver = true;
		var self = this;
		Crafty("Snake").get().forEach(function(snake) {
			Crafty("Target").get().forEach(function(o) {
				if (snake.status != "lost") {
					snake.status = o.condition(snake) ? "won" : "lost";
				};
			});
			self.updateScore(snake);
		});
	},
});

Crafty.c("Objective", {
	init: function() {
		this.requires("2D");
		this.bind("SnakeChanged", this.checkCompletion);
	},
	Objective: function(text, condition) {
		this.textTemplate = text;
		this.text = text;
		this.condition = condition;
		this.condition({score:0});
		Crafty.trigger("ObjectiveChanged", this);
		return this;
	},
	checkCompletion: function(snake) {
		var conditionMet = this.condition(snake);
		if (conditionMet) {
			this.completed = true;
			this.trigger("ConditionMet", snake);
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
});

Crafty.c("Bonus", {
	init: function() {
		this.requires("Objective");
	},
});

Crafty.c("Target", {
	init: function() {
		this.requires("Objective");
		this.bind("ConditionMet", this.triggerGameOver);
	},
	triggerGameOver: function(snake) {
		Crafty.trigger("GameOver");
	},
});

Crafty.c("TwoPlayerTarget", {
	init: function() {
		this.requires("Target");
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
			var pi = Crafty.e("PointItem");
			pi.color = "#ffff00";
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
		if (data.pointItem.scene !== undefined) {
			this.changeScene(data.pointItem.scene);
		} else if (data.pointItem.menuEntries !== undefined) {
			this.clearCells();
			this.MenuPoints(data.pointItem.menuEntries);
		};
	},
});
