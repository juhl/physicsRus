function Contact(p, n, d, hash) {
	this.hash = hash;

	// Contact point
	this.p = p; 

	// Contact normal (toward shape2)
	this.n = n; 

	// Penetration depth (d < 0)
	this.d = d; 

	// Accumulated normal impulse
	this.jn_acc = 0;

	// Accumulated tangential impulse
	this.jt_acc = 0;

	// Accumulated position correction impulse
	this.jp_acc = 0;
}