interface Vector2
{
	x : number;
	y : number;
}

interface Color
{
	r : number;
	g : number;
	b : number;
    a?: number;

}

function Vector2New(x : number = 0, y : number = 0) {
    return { x: x, y: y };
}

function Vector2FromAngle(ang : number, len : number = 1) : Vector2
{
    return Vector2New(Math.cos(ang * Math.PI / 180) * len, -Math.sin(ang * Math.PI / 180) * len);
}


function Vector2Clone(self: Vector2) : Vector2
{
    return Vector2New(self.x, self.y);
}

function Vector2ScalarMul(self: Vector2, s : number) : void
{
    self.x *= s;
    self.y *= s;
}


function Vector2ScalarDiv(self: Vector2, s : number) : void
{
    self.x /= s;
    self.y /= s;
}


function Vector2Add(self: Vector2, o: Vector2): void
{
    self.x += o.x;
    self.y += o.y;
}



function Vector2Sub(self: Vector2, o: Vector2): void
{
    self.x -= o.x;
    self.y -= o.y;
}

function Vector2GetAngle(self: Vector2) : number
{
    return Math.atan2(-self.y, self.x) * 180.0 / Math.PI;
}

function Vector2Length(self: Vector2) : number
{
return Math.sqrt(self.x * self.x + self.y * self.y);
}

function Vector2Normalize(self: Vector2) : void
{
    let l = Vector2Length(self);
    if(l == 0) {
        self.x = 1;
        self.y = 0;
        return;
    }
    Vector2ScalarDiv(self, l);
}

function Vector2Dot(self: Vector2, o: Vector2): number
{
    return self.x * o.x + self.y * o.y;
}

