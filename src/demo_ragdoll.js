DemoRagDoll = function() {
	var space;
	function init(s) {
		space = s;
		var staticBody = new Body(Body.STATIC);
		staticBody.addShape(new ShapeBox(0, 0.2, 20.48, 0.4));
		staticBody.addShape(new ShapeBox(0, 15.16, 20.48, 0.4));
		staticBody.addShape(new ShapeBox(-10.04, 7.68, 0.4, 14.56));
		staticBody.addShape(new ShapeBox(10.04, 7.68, 0.4, 14.56));
		staticBody.resetMassData();
		space.addBody(staticBody);		
			
		// Head
		var bodyHead = new Body(Body.DYNAMIC, new vec2(0, 7.45));
		var shape = new ShapeCircle(0, 0, 0.48);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 5;
		bodyHead.addShape(shape);
		bodyHead.resetMassData();
		space.addBody(bodyHead);

		// Spine1        
		var bodySpine1 = new Body(Body.DYNAMIC, new vec2(0, 6.4));
		//var shape = new ShapeBox(0, 0, 1.5, 0.7);
		var shape = new ShapePoly([new vec2(-0.8, 0.35), new vec2(-0.64, -0.3), new vec2(0.64, -0.3), new vec2(0.8, 0.35)]);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 4;
		bodySpine1.addShape(shape);
		bodySpine1.resetMassData();
		space.addBody(bodySpine1);

		// Spine2        
		var bodySpine2 = new Body(Body.DYNAMIC, new vec2(0, 5.8));
		var shape = new ShapeBox(0, 0, 1.2, 0.7);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 4;
		bodySpine2.addShape(shape);
		bodySpine2.resetMassData();
		space.addBody(bodySpine2);

		// Spine3       
		var bodySpine3 = new Body(Body.DYNAMIC, new vec2(0, 5.2));
		var shape = new ShapeBox(0, 0, 1.2, 0.7);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 4;
		bodySpine3.addShape(shape);
		bodySpine3.resetMassData();
		space.addBody(bodySpine3);

		// Pelvis        
		var bodyPelvis = new Body(Body.DYNAMIC, new vec2(0, 4.55));
		var shape = new ShapePoly([new vec2(-0.6, 0.35), new vec2(-0.64, -0.3), new vec2(0.64, -0.3), new vec2(0.6, 0.35)]);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 4;
		bodyPelvis.addShape(shape);
		bodyPelvis.resetMassData();
		space.addBody(bodyPelvis);

		// Left Arm1        
		var bodyLArm1 = new Body(Body.DYNAMIC, new vec2(-1.35, 6.5));
		var shape = new ShapeBox(0, 0, 1.3, 0.35);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 3;
		bodyLArm1.addShape(shape);
		bodyLArm1.resetMassData();
		space.addBody(bodyLArm1);

		// Left Arm2        
		var bodyLArm2 = new Body(Body.DYNAMIC, new vec2(-2.6, 6.5));
		var shape = new ShapeBox(0, 0, 1.4, 0.35);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 3;
		bodyLArm2.addShape(shape);
		bodyLArm2.resetMassData();
		space.addBody(bodyLArm2);

		// Right Arm1        
		var bodyRArm1 = new Body(Body.DYNAMIC, new vec2(1.35, 6.5));
		var shape = new ShapeBox(0, 0, 1.3, 0.35);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 3;
		bodyRArm1.addShape(shape);
		bodyRArm1.resetMassData();
		space.addBody(bodyRArm1);

		// Right Arm2       
		var bodyRArm2 = new Body(Body.DYNAMIC, new vec2(2.6, 6.5));
		var shape = new ShapeBox(0, 0, 1.4, 0.35);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 3;
		bodyRArm2.addShape(shape);
		bodyRArm2.resetMassData();
		space.addBody(bodyRArm2);

		// Left Leg1       
		var bodyLLeg1 = new Body(Body.DYNAMIC, new vec2(-0.4, 3.35));
		var shape = new ShapeBox(0, 0, 0.5, 1.9);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 3;
		bodyLLeg1.addShape(shape);
		bodyLLeg1.resetMassData();
		space.addBody(bodyLLeg1);

		// Left Leg2        
		var bodyLLeg2 = new Body(Body.DYNAMIC, new vec2(-0.4, 1.5));
		var shape = new ShapeBox(0, 0, 0.5, 2.0);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 3;
		bodyLLeg2.addShape(shape);
		bodyLLeg2.resetMassData();
		space.addBody(bodyLLeg2);

		// Right Leg1        
		var bodyRLeg1 = new Body(Body.DYNAMIC, new vec2(0.4, 3.35));
		var shape = new ShapeBox(0, 0, 0.5, 1.9);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 3;
		bodyRLeg1.addShape(shape);
		bodyRLeg1.resetMassData();
		space.addBody(bodyRLeg1);

		// Right Leg2        
		var bodyRLeg2 = new Body(Body.DYNAMIC, new vec2(0.4, 1.5));
		var shape = new ShapeBox(0, 0, 0.5, 2.0);
		shape.e = 0.1;
		shape.u = 0.8;
		shape.density = 3;
		bodyRLeg2.addShape(shape);
		bodyRLeg2.resetMassData();
		space.addBody(bodyRLeg2);

		var joint = new RevoluteJoint(bodyHead, bodySpine1, new vec2(0, 6.7));
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-40), deg2rad(40));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodySpine1, bodySpine2, new vec2(0, 6.1));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-5), deg2rad(5));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodySpine2, bodySpine3, new vec2(0, 5.5));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-5), deg2rad(5));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodySpine3, bodyPelvis, new vec2(0, 4.9));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-20), deg2rad(20));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodySpine1, bodyLArm1, new vec2(-0.75, 6.5));
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-100), deg2rad(100));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodyLArm1, bodyLArm2, new vec2(-1.95, 6.5));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-170), deg2rad(10));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodySpine1, bodyRArm1, new vec2(0.75, 6.5));
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-100), deg2rad(100));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodyRArm1, bodyRArm2, new vec2(1.95, 6.5));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-10), deg2rad(170));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodyPelvis, bodyLLeg1, new vec2(-0.4, 4.25));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-100), deg2rad(50));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodyLLeg1, bodyLLeg2, new vec2(-0.4, 2.45));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-15), deg2rad(150));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodyPelvis, bodyRLeg1, new vec2(0.4, 4.25));
		joint.collideConnected = false;
		joint.enableLimit(true);        
		joint.setLimits(deg2rad(-50), deg2rad(100));
		space.addJoint(joint);

		var joint = new RevoluteJoint(bodyRLeg1, bodyRLeg2, new vec2(0.4, 2.45));
		joint.collideConnected = false;
		joint.enableLimit(true);
		joint.setLimits(deg2rad(-150), deg2rad(15));
		space.addJoint(joint);

		//bodyHead.applyLinearImpulse(new vec2(120, 0), new vec2(0, 7.34));
	}

	function runFrame() {
	}

	function keyDown(ev) {
	}

	function name() {
		return "Rag-doll";
	}

	return {
		init: init,
		runFrame: runFrame,
		keyDown: keyDown,
		name: name
	};
}();