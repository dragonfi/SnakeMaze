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
		Crafty.trigger("CellCreated", this);
		return this;
	},
	clear: function() {
		this.tween(this._null_attrs, Game.cellDelay);
		Crafty.trigger("CellRemoved", this);
		this.alreadyRemoved = true;
		this.delay(function() {
			this.destroy();
		}, Game.cellDelay);
	},
	remove: function() {
		if (!this.alreadyRemoved) {
			Crafty.trigger("CellRemoved", this);
		};
	},
});

Crafty.c("_CellHandler", {
	init: function() {
		this.bind("CellCreated", this._addCell);
		this.bind("CellRemoved", this._removeCell);
	},
	allCells: (function() {
		var allCells = [];
		for (var col = 0; col < Game.cols; col++) {
			allCells[col] = [];
			for (var row = 0; row < Game.rows; row++) {
				allCells[col][row] = [];
			};
		};
		return allCells;
	})(),
	emptyCells: function() {
		var emptyCells = [];
		for (var col in this.allCells) {
			for (var row in this.allCells[col]) {
				if (this.allCells[col][row].length === 0) {
					emptyCells.push({col: col, row: row});
				};
			};
		};
		return emptyCells;
	},
	checkHits: function(cell) {
		var cellsAtSameCoords = this.allCells[cell.col][cell.row];
		if (cellsAtSameCoords.length > 1) {
			var otherCells = cellsAtSameCoords.filter(function(other) {
				return other !== cell;
			});
			var otherObjs = otherCells.map(function(cell) {
				return cell.parent;
			});
			cell.parent.trigger("OnHit", otherObjs);
		};
	},
	_addCell: function(cell) {
		this.allCells[cell.col][cell.row].push(cell);
		this.checkHits(cell);
	},
	_removeCell: function(cell) {
		var localList = this.allCells[cell.col][cell.row];
		var index = localList.indexOf(cell);
		if (index !== -1) {
			localList.splice(index, 1);
		};
	},
});


Crafty.c("Grid", {
	cellHandler: Crafty.e("_CellHandler"),
	init: function() {
		this.requires("2D, Delay");
		this.cells = [];
	},
	emptyCells: function() {
		return this.cellHandler.emptyCells();
	},
	createCell: function(col, row, parent) {
		var cell = Crafty.e("Cell").Cell(col, row, parent);
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
		this.color = "#ffff00";
		this.bind("PointItemEaten", function(args) {
			if (args.pointItem === this) {
				this.randomMove();
			};
		});
	},
	PointItem: function(col, row) {
		this.col = Math.floor(col);
		this.row = Math.floor(row);
		this.createCell(this.col, this.row, this);
		return this;
	},
	randomMove: function() {
		this.clearCells();
		var coords = Utils.rand.choice(this.emptyCells());
		if (coords === undefined) {
			Crafty.trigger("GameOver", "no free cells left");
			return;
		};
		this.col = coords.col;
		this.row = coords.row;
		this.createCell(this.col, this.row, this);
	},
});

Crafty.c("BorderWalls", {
	init: function() {
		this.requires("Grid, Wall");
		this.color = "#aaaaaa";
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
		this.bind("OnHit", this.handleCollisions);
		this.bind("ClearGame", this.stopMovement);
	},
	Snake: function(col, row, dir, len, color) {
		this.attr({
			color: color,
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
	startMovement: function() {
		this.delay(this.moveSnake, 200, -1);
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
			this.maxLength += 1;
			this.score += 1;
			Crafty.trigger("PointItemEaten", {snake: this, pointItem: obj});
		} else if (obj.has("Wall") || obj.has("Snake")) {
			this.stopMovement();
		};
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
		this.col += delta.col;
		this.row += delta.row;
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
Crafty.c("ScoreLine", {
	init: function() {
		this.requires("TextCell");
	},
	ScoreLine: function(lineNumber) {
		this.TextCell(0, Game.rows + lineNumber, Game.cols);
		this.text("Points:");
		return this;
	},
});

Crafty.c("Score", {
	init: function() {
		this.requires("2D");
		this.line1 = Crafty.e("ScoreLine").ScoreLine(0);
		this.bind("PointItemEaten", this.incrementScore);
		this.p1score = 0;
		this.p2score = 0;
		this.updateText();
	},
	updateText: function() {
		var text = "Score: " + this.p1score;
		if (Crafty("Snake").length > 1) {
			text = "Green: " + this.p1score + " Red: " + this.p2score;
		};
		this.line1.text(text);
	},
	incrementScore: function(data) {
		if (data.snake.has("Player1")) {
			this.p1score += 1;
		} else if (data.snake.has("Player2")) {
			this.p2score += 1;
		};
		this.updateText();
	},
});

Crafty.c("MenuPoints", {
	init: function() {
		this.requires("2D, SceneChanger");
		this.bind("PointItemEaten", this.selectNextScene);
	},
	MenuPoints: function(items) {
		for (var i in items) {
			var col = items[i][0];
			var row = items[i][1];
			var scene = items[i][2];
			var text = items[i][3];
			var pi = Crafty.e("PointItem").PointItem(col, row);
			pi.scene = scene;
			Crafty.e("TextCell").TextCell(col + 1, row).text(text);
		};
	},
	selectNextScene: function(data) {
		this.changeScene(data.pointItem.scene);
	},
});

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
