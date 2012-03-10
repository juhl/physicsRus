function Contact(p, n, d, hash) {
	this.hash = hash;

	// Contact point
	this.p = p; 

	// Contact normal (toward shape2)
	this.n = n; 

	// Penetration depth (d < 0)
	this.d = d; 

	// Accumulated normal constraint impulse
	this.ln_acc = 0;

	// Accumulated tangential constraint impulse
	this.lt_acc = 0;

	// Accumulated position correction constraint impulse
	this.lp_acc = 0;
}