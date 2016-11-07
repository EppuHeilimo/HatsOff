class DrawableText implements Drawable
{
	private texture : Texture;
	private charSize : Vector2;

	public visible : boolean = true;

	public text : string;
	public characterScale : number;
	public depth : number;
	public position : Vector2;
	public screenSpace : boolean = false;
    constructor()
	{
		this.text = "";
		this.depth = 0;
		this.characterScale = 1;
        this.position = Vector2New(0,0);
	}

	public setTexture(tex : Texture) : void
	{
		this.texture = tex;
	}

	public draw() : void
	{
		let sb = new ShaderBinder();
		sb.useShader(GFX.shaders["text"]);

		GFX.gl.bindTexture(GFX.gl.TEXTURE_2D, this.texture.texture);

	
        this.charSize = Vector2Clone(this.texture.size);
		this.charSize.x /= 8;
		this.charSize.y /= 12;

        let scaledSize = Vector2Clone(this.charSize);
		scaledSize.x *= this.characterScale;
		scaledSize.y *= this.characterScale;

		let a = Vector2Clone(scaledSize);


		a.x /= 2;
		a.y /= 2;
		
		a.x += this.position.x;
		a.y += this.position.y;

        let linePos = Vector2Clone(a);

		for (let i = 0; i < this.text.length; i++)
		{
			if (this.text.charAt(i) == "\n")
			{
				linePos.y += scaledSize.y;
				a = Vector2Clone(linePos);
				continue;
			}
			GFX.gl.uniform1f(GFX.currentShader.uniforms["charindex"],this.text.charCodeAt(i)-32);
			if (this.screenSpace)
				GFX.drawCenteredScreenSpaceTextureless(a, this.depth, scaledSize);
			else
				GFX.drawCenteredTextureless(a, this.depth, scaledSize);
			a.x += scaledSize.x;
		}

		sb.restoreShader();
	}
}