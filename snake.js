Game = {
	tileSize: 20,
	borderSize: 5,
	rows: 16,
	cols: 12,
}

Game.offset = Game.tileSize + Game.borderSize;
Game.w = Game.offset * Game.rows + Game.borderSize;
Game.h = Game.offset * Game.cols + Game.borderSize;

Crafty.c("Cell", {
	init: function() {
		this.requires("2D, DOM, Color, Tween");
		this.attr({w: Game.tileSize, h: Game.tileSize});
	},
	at: function(x, y) {
		this.attr({
			x: Game.borderSize + Game.offset * x,
			y: Game.borderSize + Game.offset * y,
		});
		return this;
	},
	tweenColor: function(color) {
		var _this = this;
		var delta = 400;
		this.tween({h: 0, alpha: 0}, delta)
		.one("TweenEnd", function(){
			_this.color(color);
			_this.tween({h: Game.tileSize, alpha: 1}, delta);
		});
		return this;
	},
});

Crafty.c("Grid", {
	grid: function(x, y) {
		this.cells = {};
		var max_x = Game.w / Game.offset;
		var max_y = Game.h / Game.offset;
		for (var x = 0; x <= max_x; x++) {
			for (var y = 0; y <= max_y; y++) {
				this.cells[this._key(x, y)] = Crafty.e("Cell")
				.at(x, y).tweenColor("#aaaaaa");
			};
		};
		return this;
	},
	at: function(x, y) {
		return this.cells[this._key(x, y)];
	},
	_key: function(x, y) {
		return "" + x + ", " + y;
	},
});

Crafty.scene("Main", function() {
	var g = Crafty.e("Grid").grid(Game.rows, Game.cols);
	
	Crafty.e("Delay").delay(function(){
		var randint = function(n){
			return Math.floor(Math.random() * n);
		};
		var x = randint(Game.rows);
		var y = randint(Game.cols);
		var red = randint(256);
		var green = randint(256);
		var blue = randint(256);
		var rgb = "rgb(" + red + "," + green + "," + blue + ")";
		g.at(x, y).tweenColor(rgb);
	}, 50, -1);
});

window.onload = function() {
	Crafty.init(Game.w, Game.h);
	Crafty.background("#000000");
	Crafty.e("2D, DOM, Color")
	.attr({x: 10, y: 10, w: 100, h: 100})
	.color("#0000ff");
	Crafty.scene("Main");
};
