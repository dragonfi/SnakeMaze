var Utils = {
	randInt: function(n){
		return Math.floor(Math.random() * n);
	},
	randomChoice: function(seq) {
		return seq[Utils.randInt(seq.length)];
	},
}
