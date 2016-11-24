class DrawableColorBox implements Drawable
{
	public visible : boolean = true;

	public depth : number;
	public position : Vector2;
	public size : Vector2;
	public color : Color;

	constructor()
	{
		this.depth = 0;
        this.position = Vector2New(0,0);
        this.size = Vector2New(0,0);
		this.color = {r: 0, g: 0, b: 0, a: 1.0};
	}

	public draw() : void
	{
		let sb = new ShaderBinder();
		sb.useShader(GFX.shaders["colored"]);
		
		GFX.gl.uniform4f(GFX.currentShader.uniforms["color"], this.color.r, this.color.g, this.color.b, this.color.a ? this.color.a : 1.0 );

        GFX.drawCenteredTextureless(this.position, this.depth, this.size);

		sb.restoreShader();
	}
}

class DrawableTextureBox implements Drawable {
    public visible: boolean = true;

    public depth: number;
    public position: Vector2;
    public size: Vector2;
    public texture: Texture;
    public horizontalFlip: boolean;

    constructor() {
        this.depth = 0;
        this.position = Vector2New(0, 0);
        this.size = Vector2New(0, 0);
        this.texture = null;
    }

    public draw(): void {
        if (this.texture) {
            if (this.horizontalFlip)
                GFX.drawCentered(this.texture, this.position, this.depth, { x: this.size.x * -1, y: this.size.y });
            else
                GFX.drawCentered(this.texture, this.position, this.depth, this.size);
        }
    }
}


class DrawableTestParticle extends DrawableColorBox {
    private maxSize: Vector2;
    private timer: number;
    private velocity: Vector2;
    constructor(maxSize: Vector2) {
        super();
        this.maxSize = maxSize;
        this.timer = 60;
        this.velocity = Vector2New(Math.random() * 2 - 1, Math.random() * 2 - 1);
    }

    public draw(): void {
        Vector2Add(this.position, this.velocity);
        this.velocity.y += 0.1;
        this.timer -= 1;
        this.size.x = this.maxSize.x * this.timer / 60.0;
        this.size.y = this.maxSize.x * this.timer / 60.0;
        if (this.timer <= 0)
            GFX.removeDrawable(this);
        super.draw();
        
    }
}
