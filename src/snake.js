// Requires: crafty.js
// Requires: utils.js
// Requires: kongregate.js

var Game = {
	rows: 23,
	cols: 12,
	tileSize: 20,
	borderSize: 5,
	cellDelay: 200,
	backgroundColor: "#aaaaaa",
}

Game.offset = Game.tileSize + Game.borderSize;
Game.w = Game.rows * Game.offset + Game.borderSize;
Game.h = (Game.cols + 1) * Game.offset + Game.borderSize;

Crafty.c("Cell", {
	init: function() {
		this.requires("2D, Canvas, Color, Tween, Delay");
	},
	cell: function(col, row, color) {
		this._orig_attrs = {
			x: col * Game.offset + Game.borderSize,
			y: row * Game.offset + Game.borderSize,
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
		this.attr(this._null_attrs).color(color);
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
	},
});

Crafty.c("Grid", {
	init: function() {
		this.requires("2D, Delay");
		this.cells = {};
	},
	colorAt: function(col, row, color) {
		var key = this._key(col, row);
		if (this.cells[key] !== undefined) {
			this.clearAt(col, row);
		};
		this.cells[key] = Crafty.e("Cell").cell(col, row, color);
	},
	clearAt: function(col, row) {
		var key = this._key(col, row);
		if (this.cells[key] !== undefined) {
			this.cells[key].clear();
		};
		delete this.cells[key];
	},
	_key: function(col, row) {
		if (row === undefined && typeof(col) === "string") {
			return col;
		};
		return "" + col + "," + row;
	},
	remove: function() {
		for (var key in this.cells) {
			this.clearAt(key);
		};
	},
});

Crafty.c("PointItem", {
	init: function() {
		this.requires("Grid");
		this.color = "#ffff00";
	},
	pointItem: function(col, row) {
		this.col = col;
		this.row = row;
		this.colorAt(this.col, this.row, this.color);
		return this;
	},
});

Crafty.c("Snake", {
	init: function() {
		this.requires("Grid");
		this.segments = [];
		this._dir = "right";
	},
	snake: function(col, row, dir, len, color) {
		this.attr({
			color: color,
			col: col,
			row: row,
			maxLen: len,
		});
		this._addSegment(this.col, this.row);
		this.delay(this.moveSnake, 1000, -1);
		return this;
	},
	_addSegment: function(col, row) {
		this.segments.push({col: col, row: row});
		this.colorAt(col, row, this.color);
		while (this.segments.length > this.maxLen) {
			var segment = this.segments.shift();
			this.clearAt(segment.col, segment.row);
		};
	},
	_directions: {
		"right": {col: 1, row: 0},
		"left": {col: -1, row: 0},
		"up": {col: 0, row: -1},
		"down": {col: 0, row: 1},
	},
	moveSnake: function() {
		var delta = this._directions[this._dir];
		this.col += delta.col;
		this.row += delta.row;
		this._addSegment(this.col, this.row);
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
	direction: function(dir) {
		this._dir = dir;
	},
});


Crafty.c("Player1", {
	init: function() {
		this.requires("Controls, Snake");
		this.keymap = {
			"UP_ARROW": this.direction.bind(this, "up"),
			"DOWN_ARROW": this.direction.bind(this, "down"),
			"LEFT_ARROW": this.direction.bind(this, "left"),
			"RIGHT_ARROW": this.direction.bind(this, "right"),
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
	var pi = Crafty.e("PointItem").pointItem(4, 5);
	var p1 = Crafty.e("Player1").snake(3, 4, "right", 5, "#00ff00");
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
