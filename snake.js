var Game = {
	rows: 16,
	cols: 9,
	tileSize: 20,
	borderSize: 5,
}

Game.offset = Game.tileSize + Game.borderSize;
Game.w = Game.rows * Game.offset + Game.borderSize;
Game.h = Game.cols * Game.offset + Game.borderSize;

var Utils = {
	randInt: function(n){
		return Math.floor(Math.random() * n);
	},
}

Crafty.c("Cell", {
	tileSize: Game.tileSize,
	borderSize: Game.borderSize,
	offset: Game.tileSize + Game.borderSize,
	init: function() {
		this.requires("2D, DOM, Color, Tween");
		this.attr({w: this.tileSize, h: this.tileSize});
	},
	at: function(x, y) {
		this.attr({
			x: this.borderSize + this.offset * x,
			y: this.borderSize + this.offset * y,
		});
		return this;
	},
	tweenColor: function(color) {
		var _this = this;
		var delta = 400;
		this.tween({h: 0, alpha: 0}, delta)
		.one("TweenEnd", function(){
			this.color(color);
			this.tween({h: this.tileSize, alpha: 1}, delta);
		});
	},
});

Crafty.c("Grid", {
	grid: function(rows, cols) {
		this.rows = rows;
		this.cols = cols;
		this.cells = {};
		this._createCells();
		this.clearGrid();
		return this;
	},
	at: function(x, y) {
		return this.cells[this._key(x, y)];
	},
	clearGrid: function() {
		this.trigger("StopFlipping");
		var maxDelay = 0;
		for (var x = 0; x < this.rows; x++) {
			for (var y = 0; y < this.cols; y++) {
				var delay = this._delayedTweenColor(x, y);
				maxDelay = Math.max(maxDelay, delay);
			};
		};
		var self = this;
		Crafty.e("Delay").delay(function(){
			self.trigger("Ready");
			self.trigger("StartFlipping");
		}, maxDelay + 800, 0);
	},
	_createCells: function() {
		for (var x = 0; x < this.rows; x++) {
			for (var y = 0; y < this.cols; y++) {
				this.cells[this._key(x, y)] = Crafty.e("Cell").at(x, y);
			};
		};
	},
	_key: function(x, y) {
		return "" + x + ", " + y;
	},
	_delayedTweenColor: function(x, y) {
		var delay = 100*x + 100*y;
		var self = this;
		Crafty.e("Delay").delay(function() {
			self.at(x, y).tweenColor("#aaaaaa");
		}, delay, 0);
		return delay;
	},
});

Crafty.c("RandomFlipper", {
	init: function() {
		this.requires("Delay, Grid");
		this.bind("StartFlipping", this.startFlipping);
		this.bind("StopFlipping", this.stopFlipping);
	},
	flipRandomCell: function() {
		var x = Utils.randInt(this.rows);
		var y = Utils.randInt(this.cols);
		var red = Utils.randInt(256);
		var green = Utils.randInt(256);
		var blue = Utils.randInt(256);
		var rgb = "rgb(" + red + "," + green + "," + blue + ")";
		this.at(x, y).tweenColor(rgb);
	},
	startFlipping: function() {
		this.delay(this.flipRandomCell, 50, -1);
	},
	stopFlipping: function() {
		this.cancelDelay(this.flipRandomCell);
	},
	remove: function() {
		this.stopFlipping();
	},
});

Crafty.c("ClearOnSpace", {
	init: function() {
		this.requires("Grid, Keyboard");
		this.bind("KeyDown", function() {
			if (this.isDown("SPACE")) {
				this.clearGrid();
			};
		});
	},
});

Crafty.scene("Main", function() {
	var g = Crafty.e("Grid, RandomFlipper, ClearOnSpace")
	.grid(Game.rows, Game.cols);
});

window.onload = function() {
	Crafty.init(Game.w, Game.h);
	Crafty.background("#000000");
	Crafty.e("2D, DOM, Color")
	.attr({x: 10, y: 10, w: 100, h: 100})
	.color("#0000ff");
	Crafty.scene("Main");
};
