var Utils = {};

Utils.mod = function(n, m) {
	return ((n % m) + m) % m;
};

Utils.rand = {
	int: function(n){
		return Math.floor(Math.random() * n);
	},
	choice: function(seq) {
		return seq[Utils.rand.int(seq.length)];
	},
};
