var Utils = {};

Utils.rand = {
	int: function(n){
		return Math.floor(Math.random() * n);
	},
	choice: function(seq) {
		return seq[Utils.rand.int(seq.length)];
	},
};
