class DrawableText implements Drawable {
    private texture: Texture;
    private charSize: Vector2;

    public visible: boolean = true;

    public text: string;
    public characterScale: number;
    public depth: number;
    public position: Vector2;
    public screenSpace: boolean = false;
    public color: Color;
    public centering: boolean = false;
    public lineLengths: number[] = [];
    constructor()
    {
        this.centering = false;
		this.text = "";
		this.depth = 0;
		this.characterScale = 1;
        this.position = Vector2New(0, 0);
        this.color = { r: 1, g: 1, b: 1, a: 1.0 };
        
    }

    public recalculateLineLengths(): void {
        
        this.lineLengths = [];
        let curlen = 0;
        for (let i = 0; i < this.text.length; i++) {
            if (this.text.charAt(i) == "\n") {
                this.lineLengths.push(curlen);
                curlen = 0;
                continue;
            }
            curlen++;
        }
        this.lineLengths.push(curlen);
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

        GFX.gl.uniform4f(GFX.currentShader.uniforms["color"], this.color.r, this.color.g, this.color.b, this.color.a ? this.color.a : 1.0);
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
        let linenum = 0;
        let damaster = this;
        function getLineLength() {
            if (!damaster.centering)
                return 0;
            let v = damaster.lineLengths[linenum]
            if (v)
                return v;
            return 0;
        }

        a.x -= scaledSize.x * getLineLength() / 2
		for (let i = 0; i < this.text.length; i++)
		{
			if (this.text.charAt(i) == "\n")
			{
                linePos.y += scaledSize.y;
                linenum++;
                a = Vector2Clone(linePos);
                a.x -= scaledSize.x * getLineLength() / 2
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