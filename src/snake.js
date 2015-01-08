// Requires: crafty.js
// Requires: utils.js
// Requires: kongregate.js

var Game = {
	cols: 16,
	rows: 9,
	tileSize: 20,
	borderSize: 5,
	cellDelay: 500,
}

Game.offset = Game.tileSize + Game.borderSize;
Game.w = Game.cols * Game.offset + Game.borderSize;
Game.h = Game.rows * Game.offset + Game.borderSize;

Crafty.c("Cell", {
	allCells: {},
	init: function() {
		this.requires("2D, Canvas, Color, Tween, Delay");
	},
	cell: function(col, row, parent) {
		this.col = col;
		this.row = row;
		this._addToAllCells();
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
		return this;
	},
	clear: function() {
		this.tween(this._null_attrs, Game.cellDelay);
		this.delay(function() {
			this.destroy();
		}, Game.cellDelay);
	},
	remove: function() {
		this._removeFromAllCells();
	},
	_key: function() {
		return this.col + "," + this.row;
	},
	_addToAllCells: function() {
		var key = this._key();
		if (this.allCells[key] === undefined) {
			this.allCells[key] = [];
		};
		this.allCells[key].push(this);
	},
	_removeFromAllCells: function() {
		var key = this._key();
		var index = this.allCells[key].indexOf(this);
		if (index !== -1) {
			this.allCells[key].splice(index, 1);
		};
	},
});

Crafty.c("CellWithCollision", {
	init: function() {
		this.requires("Cell");
	},
	checkHits: function() {
		var cellsAtSameCoords = this.allCells[this._key()];
		if (cellsAtSameCoords.length > 1) {
			var otherCells = cellsAtSameCoords.filter(this._differs);
			var otherObjs = otherCells.map(function(cell) {
				return cell.parent;
			});
			this.parent.trigger("OnHit", otherObjs);
		};
	},
	_differs: function(other) {
		return this !== other;
	},
});

Crafty.c("Grid", {
	init: function() {
		this.requires("2D, Delay");
		this.cells = [];
	},
	createCell: function(col, row, parent) {
		var cell = Crafty.e("CellWithCollision").cell(col, row, parent);
		this.cells.push(cell);
		cell.checkHits();
	},
	clearCells: function() {
		for (var index in cells) {
			cells[index].clear();
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
	pointItem: function(col, row) {
		this.col = col;
		this.row = row;
		this.createCell(this.col, this.row, this);
		return this;
	},
	randomMove: function() {
	},
});

Crafty.c("BorderWalls", {
	init: function() {
		this.requires("Grid");
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
		this.bind("OnHit", this.handleCollisions);
	},
	snake: function(col, row, dir, len, color) {
		this.attr({
			color: color,
			col: col,
			row: row,
			dir: dir,
			newDir: dir,
			maxLength: len,
		});
		this._addSegment(this.col, this.row);
		this.delay(this.moveSnake, 200, -1);
		return this;
	},
	handleCollisions: function(objs) {
		for (var index in objs) {
			this._handleCollision(objs[index]);
		};
	},
	_handleCollision: function(obj) {
		if (obj.has("PointItem")) {
			this.maxLength += 1;
			Crafty.trigger("PointItemEaten", {snake: this, pointItem: obj});
		} else if (obj.has("BorderWalls")) {
			this.cancelDelay(this.moveSnake);
			Crafty.trigger("SnakeStopped", {snake: this});
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
				this.keymap[key]();
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

Crafty.scene("SetUp", function() {
	console.log("SetUp");
	Crafty.e("Delay").delay(function() {
		Crafty.scene("SnakeGame");
	}, 1000);
});

Crafty.scene("SnakeGame", function() {
	console.log("Test");
	var wall = Crafty.e("BorderWalls");
	var pi = Crafty.e("PointItem").pointItem(5, 4);
	var p1 = Crafty.e("Player1").snake(3, 4, "right", 5, "#00ff00");
	Crafty.bind("PointItemEaten", function(args) {
		console.log("eaten:", args.snake, args.pointItem);
	});
	Crafty.e("Delay").delay(function() {
	}, 2000);
});

Crafty.scene("Empty", function(){});

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
		Crafty.scene("SetUp");
	});
};
