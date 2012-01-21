Shape = function(type) {
    if (arguments.length == 0)
        return;

    if (Shape.id_counter == undefined)
        Shape.id_counter = 0;
    
    this.id = Shape.id_counter++;
    this.type = type;

    // Coefficient of restitution (elasticity)
    this.e = 0.0;

    // Frictional coefficient
    this.u = 1.0;

    // Axis-aligned bounding box
    this.bounds = new Bounds;    
}

Shape.TYPE_CIRCLE = 0;
Shape.TYPE_SEGMENT = 1;
Shape.TYPE_POLY = 2;
Shape.NUM_TYPES = 3;

