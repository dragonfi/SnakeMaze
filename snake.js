var Game = {
	rows: 23,
	cols: 12,
	tileSize: 20,
	borderSize: 5,
	backgroundColor: "#aaaaaa",
}

Game.offset = Game.tileSize + Game.borderSize;
Game.w = Game.rows * Game.offset + Game.borderSize;
Game.h = (Game.cols + 1) * Game.offset + Game.borderSize;

var Utils = {
	randInt: function(n){
		return Math.floor(Math.random() * n);
	},
	randomChoice: function(seq) {
		return seq[Utils.randInt(seq.length)];
	},
}

Crafty.c("Cell", {
	tileSize: Game.tileSize,
	borderSize: Game.borderSize,
	offset: Game.tileSize + Game.borderSize,
	init: function() {
		this.requires("2D, Canvas, Color, Tween, Persist");
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
		Crafty.trigger("CellFlip");
		var _this = this;
		var delta = 400;
		this.tween({h: 0, alpha: 0}, delta)
		.one("TweenEnd", function(){
			this.color(color);
			this.tween({h: this.tileSize, alpha: 1}, delta);
		});
		return this;
	},
});

Crafty.c("Grid", {
	backgroundColor: Game.backgroundColor,
	init: function() {
		this.requires("Delay");
		this.bind("SceneChange", this.clearGrid);
	},
	grid: function(rows, cols) {
		this.rows = rows;
		this.cols = cols;
		this.cells = {};
		this._createCells();
		return this;
	},
	at: function(x, y) {
		var key = this._key(x, y);
		if (y === undefined) {
			key = x;
		};
		return this.cells[key];
	},
	clearGrid: function() {
		Crafty.trigger("StopFlipping");
		var maxDelay = 0;
		for (var x = 0; x < this.rows; x++) {
			for (var y = 0; y < this.cols; y++) {
				var delay = this._delayedTweenColor(x, y);
				maxDelay = Math.max(maxDelay, delay);
			};
		};
		var self = this;
		this.delay(function(){
			Crafty.trigger("GridReady");
		}, maxDelay + 800, 0);
	},
	getKeys: function() {
		return Object.keys(this.cells);
	},
	colorAt: function(x, y, color, obj) {
		this.at(x, y).tweenColor(color).obj = obj;
	},
	resetColorAt: function(x, y) {
		this.at(x, y).tweenColor(this.backgroundColor).obj = undefined;
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
		this.delay(function() {
			self.resetColorAt(x, y);
		}, delay, 0);
		return delay;
	},
});

Crafty.c("RandomFlipper", {
	init: function() {
		this.requires("Delay");
	},
	grid: function(grid) {
		if (grid === undefined) {
			return this._grid;
		};
		this._grid = grid;
		this.bind("GridReady", this.startFlipping);
		return this;
	},
	flipRandomCell: function() {
		var x = Utils.randInt(this._grid.rows);
		var y = Utils.randInt(this._grid.cols);
		var red = Utils.randInt(256);
		var green = Utils.randInt(256);
		var blue = Utils.randInt(256);
		var rgb = "rgb(" + red + "," + green + "," + blue + ")";
		this._grid.colorAt(x, y, rgb);
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

Crafty.c("PointItem", {
	color: "#cccc00",
	pointItem: function(grid) {
		this._grid = grid;
		this.bind("GridReady", this.randomPlacement);
		this.bind("PointItemEaten", this.randomPlacement)
	},
	randomPlacement: function() {
		if (this.nextPosition !== undefined) {
			this.warpTo(this.nextPosition);
			this.nextPosition = undefined;
			return;
		};
		var self = this;
		var validPositions = this._grid.getKeys().filter(function(key){
			return self._grid.at(key).obj === undefined;
		});
		this.warpTo(Utils.randomChoice(validPositions));
	},
	warpTo: function(key) {
		if (this._key != undefined) {
			this._grid.resetColorAt(this._key);
		};
		this._key = key;
		this._grid.colorAt(this._key, undefined, this.color, this);
	},
});

Crafty.c("Snake", {
	init: function() {
		this.requires("Delay");
		this._segments = [];
	},
	snake: function(grid, x, y, dir, maxLen, color) {
		this._grid = grid;
		this._segments[0] = {x: x, y: y};
		this._dir = dir;
		this._lastMoveDirection = this._dir;
		this._maxLen = maxLen;
		this._speedFactor = 2000;
		this.color = color;
		this.bind("GridReady", this.startMoving);
		this.bind("OutOfBounds", this.stopMoving);
		this.bind("SelfHit", this.stopMoving);
		return this;
	},
	_recalculateMoveDelay: function() {
		this.cancelDelay(this.move);
		var delta = this._speedFactor / this._maxLen;
		Crafty.trigger("SpeedChanged", 1000 / delta);
		this.delay(this.move, delta, -1);
	},
	startMoving: function() {
		var head = this.head();
		this._grid.colorAt(head.x, head.y, this.color, this);
		this._recalculateMoveDelay();
	},
	stopMoving: function() {
		this.cancelDelay(this.move);
		Crafty.trigger("GameOver");
	},
	move: function() {
		var new_segment = this._newSegment();
		var cell = this._grid.at(new_segment.x, new_segment.y);
		if (cell === undefined) {
			this.trigger("OutOfBounds");
			return;
		};
		if (cell.obj != undefined) {
			if (cell.obj.has("PointItem")) {
				this._maxLen += 1;
				this._recalculateMoveDelay();
				Crafty.trigger("PointItemEaten");
			} else if (cell.obj.has("Snake")) {
				this.trigger("SelfHit");
			};
		};
		this._grid.colorAt(new_segment.x, new_segment.y, this.color, this);
		this._segments.push(new_segment);
		if (this._segments.length > this._maxLen) {
			var old = this._segments.shift();
			this._grid.resetColorAt(old.x, old.y);
		};
		Crafty.trigger("SnakeMoved");
	},
	head: function() {
		return this._segments[this._segments.length - 1];
	},
	_directions: {
		"right": {x: 1, y: 0},
		"left": {x: -1, y: 0},
		"up": {x: 0, y: -1},
		"down": {x: 0, y: 1},
	},
	_resetDirectionIfItPointsBackwards: function() {
		var opposites = {
			"left": "right", "right": "left",
			"up": "down", "down": "up",
		};
		if (opposites[this._dir] === this._lastMoveDirection) {
			this._dir = this._lastMoveDirection;
		};
		this._lastMoveDirection = this._dir;
	},
	_newSegment: function() {
		this._resetDirectionIfItPointsBackwards();
		var head = this.head();
		var delta = this._directions[this._dir];
		return {x: head.x + delta.x, y: head.y + delta.y};
	},
	remove: function() {
		this.stopMoving();
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

Crafty.c("Player1Controls", {
	init: function() {
		this.requires("Controls, Snake");
		this.keymap = {
			"UP_ARROW": this.direction.bind(this, "up"),
			"DOWN_ARROW": this.direction.bind(this, "down"),
			"LEFT_ARROW": this.direction.bind(this, "left"),
			"RIGHT_ARROW": this.direction.bind(this, "right"),
			"W": this.direction.bind(this, "up"),
			"S": this.direction.bind(this, "down"),
			"A": this.direction.bind(this, "left"),
			"D": this.direction.bind(this, "right"),
			"NUMPAD_8": this.direction.bind(this, "up"),
			"NUMPAD_5": this.direction.bind(this, "down"),
			"NUMPAD_4": this.direction.bind(this, "left"),
			"NUMPAD_6": this.direction.bind(this, "right"),
			"NUMPAD_2": this.direction.bind(this, "down"),
		};
	},
});

Crafty.c("SceneSelectControls", {
	init: function(){
		this.requires("Controls");
		this.keymap = {
			"SPACE": Crafty.scene.bind(Crafty, "SnakeGame"),
			"ESC": Crafty.scene.bind(Crafty, "MainMenu"),
		};
	},
});

Crafty.c("DestroyNoPersist", {
	init: function() {
		this.bind("SceneDestroy", function() {
			Crafty("NoPersist").each(function() {
				this.destroy();
			});
		});
	},
});

Crafty.c("Score", {
	init: function() {
		this._score = 0;
		this._speed = NaN;
		this._gameIsOver = false;
		var _dimensions = {
			x: Game.borderSize,
			y: Game.h - Game.offset,
			w: Game.w - Game.borderSize * 2,
			h: Game.tileSize,
		};
		this._cell = Crafty.e("2D, DOM, Color, Persist")
		.color(Game.backgroundColor)
		.attr(_dimensions);
		this.requires("2D, DOM, Text, Persist")
		.textFont({
			size: "" + Game.tileSize - 4 + "px",
			family: "Orbitron",
		})
		.textColor("#ffffff")
		.attr(_dimensions)
		.attr({x: this.x + 2, y: this.y + 2, h: this.h - 3})
		.reset();
		this.bind("PointItemEaten", this.increment);
		this.bind("ScoreChanged", this.updateText);
		this.bind("SpeedChanged", this.updateSpeed);
		this.bind("GridReady", this.reset);
		this.bind("GameOver", this.gameOver);
	},
	reset: function() {
		this._gameIsOver = false;
		this._score = 0;
		this.trigger("ScoreChanged");
	},
	gameOver: function() {
		this._gameIsOver = true;
		this.trigger("ScoreChanged");
	},
	updateSpeed: function(new_speed) {
		this._speed = new_speed;
		this.trigger("ScoreChanged");
	},
	updateText: function() {
		var prefix = " Speed: ";
		var postfix = "";
		if (this._gameIsOver) {
			postfix += " - Game Over - Press SPACE to restart"
		};
		this.text(prefix + this._speed.toFixed(2) + postfix);
		return this;
	},
	increment: function(number) {
		if (number === undefined) {
			number = 1;
		};
		this._score += number;
		this.trigger("ScoreChanged");
		return this;
	},
});

Crafty.c("Kongregate", {
	init: function() {
		kongregateAPI.loadAPI(function() {
			this.kongregate = kongregateAPI.getAPI();
			this.bind("SpeedChanged", this.updateSpeed);
			this.bind("SecretFound", this.secretFound);
		});
	},
	updateSpeed: function(new_speed) {
		this.kongregate.stats.submit("HighestSpeed", new_speed * 1000);
	},
	secretFound: function() {
		this.kongregate.stats.submit("SecretFound", 1);
	},
});

Crafty.scene("SetUp", function() {
	console.log("setup");
	Game.grid = Crafty.e("Grid").grid(Game.rows, Game.cols);
	Game.grid.addComponent("SceneSelectControls");
	Game.grid.addComponent("DestroyNoPersist");
	Game.pointItem = Crafty.e("PointItem").pointItem(Game.grid);
	Game.kongregate = Crafty.e("Kongregate");
	Game.score = Crafty.e("Score");

	Crafty.bind("GameOver", function(){Crafty.audio.play("bloop");});
	Crafty.bind("SnakeMoved", function(){Crafty.audio.play("blip");});
	Crafty.bind("PointItemEaten", function(){Crafty.audio.play("tik")});
	Crafty.scene("SnakeGame");
});

Crafty.scene("MainMenu", function() {
	console.log("main menu");
	Crafty.trigger("SecretFound");
	var rf = Crafty.e("RandomFlipper, NoPersist").grid(Game.grid);
});

Crafty.scene("SnakeGame", function() {
	console.log("snake game");
	var snake = Crafty.e("Snake, Player1Controls, NoPersist")
	.snake(Game.grid, 3, 4, "right", 5, "#00cc00");
	Crafty("PointItem").nextPosition = "10, 4";
});

window.onload = function() {
	console.log("Starting Snake Beat...");
	Crafty.init(Game.w, Game.h);
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
