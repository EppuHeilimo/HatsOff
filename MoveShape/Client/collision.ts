
interface BoxCollisionResult {
	offset: Vector2;
	found: boolean;
}


namespace Collision {

    export function testBoxCollision(center1: Vector2, size1: Vector2, center2: Vector2, size2: Vector2)
	{
        let delta = Vector2Clone(center2);
		Vector2Sub(delta,center1);
		let csize = Vector2Clone(size1);
		Vector2Add(csize, size2);
		Vector2ScalarDiv(csize, 2);
        let delta2 = Vector2Clone(delta);
		delta2.x = Math.abs(delta2.x);
		delta2.y = Math.abs(delta2.y);
		Vector2Sub(delta2,csize)
		let result = {offset: {x:0, y:0}, found: false};
		if (delta2.x <= 0 && delta2.y <= 0)
		{
			result.found = true;
			if (delta2.x < delta2.y)
				result.offset.y = delta2.y
			else
				result.offset.x = delta2.x
            result.offset.x *= -Math.sign(delta.x) 
            result.offset.y *= -Math.sign(delta.y) 

		}
		return result;
    }
}