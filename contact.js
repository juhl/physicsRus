function Contact(p, n, d, hash) {
    this.hash = hash;

    // contact point
    this.p = p; 

    // contact normal (toward shape2)
    this.n = n; 

    // penetration depth (d < 0)
    this.d = d; 

    // accumulated normal impulse
    this.jn_acc = 0;

    // accumulated tangential impulse
    this.jt_acc = 0;

    // accumulated position correction impulse
    this.jp_acc = 0;
}