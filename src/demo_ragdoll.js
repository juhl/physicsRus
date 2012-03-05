DemoRagDoll = function() {
	var space;
	function init(s) {
		space = s;
		var staticBody = new Body(Body.STATIC);
		staticBody.addShape(new ShapeBox(0, 10, 1024, 20));
		staticBody.addShape(new ShapeBox(0, 758, 1024, 20));
		staticBody.addShape(new ShapeBox(-502, 384, 20, 728));
		staticBody.addShape(new ShapeBox(502, 384, 20, 728));
		staticBody.resetMassData();
		space.addBody(staticBody);

		// Tube
		var body = new Body(Body.DYNAMIC, new vec2(-200, 200));
		var shape = new ShapeSegment(new vec2(-30, 0), new vec2(30, 0), 40);
		shape.e = 0.4;
		shape.u = 0.7;
		shape.density = 1;
		body.addShape(shape);
		body.resetMassData();
		space.addBody(body);
			
		// Head
		var bodyHead = new Body(Body.DYNAMIC, new vec2(0, 367));
		var shape = new ShapeCircle(0, 0, 23);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.8;
		bodyHead.addShape(shape);
		bodyHead.resetMassData();
		space.addBody(bodyHead);

		// Spine1        
		var bodySpine1 = new Body(Body.DYNAMIC, new vec2(0, 320));
		var shape = new ShapeBox(0, 0, 70, 20);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.6;
		bodySpine1.addShape(shape);
		bodySpine1.resetMassData();
		space.addBody(bodySpine1);

		// Spine2        
		var bodySpine2 = new Body(Body.DYNAMIC, new vec2(0, 290));
		var shape = new ShapeBox(0, 0, 65, 25);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.6;
		bodySpine2.addShape(shape);
		bodySpine2.resetMassData();
		space.addBody(bodySpine2);

		// Spine3       
		var bodySpine3 = new Body(Body.DYNAMIC, new vec2(0, 260));
		var shape = new ShapeBox(0, 0, 60, 25);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.6;
		bodySpine3.addShape(shape);
		bodySpine3.resetMassData();
		space.addBody(bodySpine3);

		// Pelvis        
		var bodyPelvis = new Body(Body.DYNAMIC, new vec2(0, 225));
		var shape = new ShapePoly([new vec2(-30, 10), new vec2(-32, -15), new vec2(32, -15), new vec2(30, 10)]);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.6;
		bodyPelvis.addShape(shape);
		bodyPelvis.resetMassData();
		space.addBody(bodyPelvis);

		// Left Arm1        
		var bodyLArm1 = new Body(Body.DYNAMIC, new vec2(-75, 320));
		var shape = new ShapeBox(0, 0, 55, 15);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.5;
		bodyLArm1.addShape(shape);
		bodyLArm1.resetMassData();
		space.addBody(bodyLArm1);

		// Left Arm2        
		var bodyLArm2 = new Body(Body.DYNAMIC, new vec2(-135, 320));
		var shape = new ShapeBox(0, 0, 55, 15);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.5;
		bodyLArm2.addShape(shape);
		bodyLArm2.resetMassData();
		space.addBody(bodyLArm2);

		// Right Arm1        
		var bodyRArm1 = new Body(Body.DYNAMIC, new vec2(75, 320));
		var shape = new ShapeBox(0, 0, 55, 15);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.5;
		bodyRArm1.addShape(shape);
		bodyRArm1.resetMassData();
		space.addBody(bodyRArm1);

		// Right Arm2       
		var bodyRArm2 = new Body(Body.DYNAMIC, new vec2(135, 320));
		var shape = new ShapeBox(0, 0, 55, 15);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.5;
		bodyRArm2.addShape(shape);
		bodyRArm2.resetMassData();
		space.addBody(bodyRArm2);

		// Left Leg1       
		var bodyLLeg1 = new Body(Body.DYNAMIC, new vec2(-20, 160));
		var shape = new ShapeBox(0, 0, 20, 85);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.5;
		bodyLLeg1.addShape(shape);
		bodyLLeg1.resetMassData();
		space.addBody(bodyLLeg1);

		// Left Leg2        
		var bodyLLeg2 = new Body(Body.DYNAMIC, new vec2(-20, 70));
		var shape = new ShapeBox(0, 0, 20, 85);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.5;
		bodyLLeg2.addShape(shape);
		bodyLLeg2.resetMassData();
		space.addBody(bodyLLeg2);

		// Right Leg1        
		var bodyRLeg1 = new Body(Body.DYNAMIC, new vec2(20, 160));
		var shape = new ShapeBox(0, 0, 20, 85);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.5;
		bodyRLeg1.addShape(shape);
		bodyRLeg1.resetMassData();
		space.addBody(bodyRLeg1);

		// Right Leg2        
		var bodyRLeg2 = new Body(Body.DYNAMIC, new vec2(20, 70));
		var shape = new ShapeBox(0, 0, 20, 85);
		shape.e = 0.4;
		shape.u = 1.0;
		shape.density = 0.5;
		bodyRLeg2.addShape(shape);
		bodyRLeg2.resetMassData();
		space.addBody(bodyRLeg2);

		var joint = new RevoluteJoint(bodyHead, bodySpine1, new vec2(0, 335));
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-40), deg2rad(40));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodySpine1, bodySpine2, new vec2(0, 305));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-5), deg2rad(5));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodySpine2, bodySpine3, new vec2(0, 275));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-5), deg2rad(5));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodySpine3, bodyPelvis, new vec2(0, 245));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-20), deg2rad(20));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodySpine1, bodyLArm1, new vec2(-45, 320));
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-120), deg2rad(120));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodyLArm1, bodyLArm2, new vec2(-105, 320));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-160), deg2rad(10));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodySpine1, bodyRArm1, new vec2(45, 320));
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-120), deg2rad(120));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodyRArm1, bodyRArm2, new vec2(105, 320));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-10), deg2rad(160));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodyPelvis, bodyLLeg1, new vec2(-20, 205));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-110), deg2rad(70));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodyLLeg1, bodyLLeg2, new vec2(-20, 115));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-30), deg2rad(160));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodyPelvis, bodyRLeg1, new vec2(20, 205));
		joint.collideConnected = false;
		joint.enableLimit(true);        
		joint.setLimits(deg2rad(-70), deg2rad(110));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodyRLeg1, bodyRLeg2, new vec2(20, 115));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-160), deg2rad(30));
		space.addJoint(joint);

		bodyHead.applyLinearImpulse(new vec2(2100000, 0), new vec2(0, 367));
	}

	function runFrame() {
	}

	function name() {
		return "Rag-doll";
	}

	return {
		init: init,
		runFrame: runFrame,
		name: name
	};
}();