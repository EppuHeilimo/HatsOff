

interface Drawable
{
	visible : boolean;
	draw() : void;
}

class ShaderBinder
{
	public lastShader : Shader;
	public useShader(shader : Shader)
	{
		this.lastShader = GFX.currentShader;
		GFX.updateShader(shader);
	}

	public restoreShader()
	{
		if (this.lastShader != null)
			GFX.updateShader(this.lastShader);

	}
}


namespace GFX
{
	export declare var textures : { [name: string]: Texture; }; //Assoc. array of all textures
	export declare var shaders : { [name: string]: Shader; }; //Assoc. array of all shaders
	export declare var gl : WebGLRenderingContext; //GL rendering context
	export declare var quadBuffer : any; //OpenGL buffer for a unit square
	export declare var camera : Vector2; 
	export declare var scale : Vector2; //essentially same as render size, used to scale from screen coordinates to normalize coordinates
	export declare var currentShader : Shader; //Currently bound shader (used to get uniforms and such)
    export declare var renderSize: Vector2; //"screen size"
	export declare var drawables: Set<Drawable>; //list of things to draw
    export declare var tileMap: DrawableTileMap;
     
	export function removeDrawable(drw : Drawable)
	{
		drawables.delete(drw);
	}

	export function addDrawable(drw : Drawable)
	{
		drawables.add(drw);
	}

	export function defineDatas() : AsyncLoader
	{
		textures = { };
		shaders = { };
		let loader = new AsyncLoader();

        //TextureImports & ShaderImports defined in assets.ts

		for (var key in TextureImports)
		{
		    if (!TextureImports.hasOwnProperty(key)) continue;

		    let source = <string> (TextureImports[key].source);
		    let ip2 =  (TextureImports[key].isPowerOfTwo);
		    let texture = new Texture(key,source,ip2);
		    textures[key] = texture;
		    loader.addElement(texture);
		}

		for (var key in ShaderImports)
		{
		    if (!ShaderImports.hasOwnProperty(key)) continue;

		    let v = (ShaderImports[key].vert);
		    let f = (ShaderImports[key].frag);
		    let shader = new Shader(key,v,f);
		    shaders[key] = shader;
		    loader.addElement(shader);
		}

		return loader;
	}

	export function updateViewport(canvas : any) : void
	{
		gl.viewport(0, 0, canvas.width, canvas.height);
		renderSize.x = canvas.width;
		renderSize.y = canvas.height;
		scale = Vector2Clone(renderSize);
	}

	export function start(canvas : any) : void
	{
        drawables = new Set<Drawable>();
        tileMap = new DrawableTileMap();

        addDrawable(tileMap);
        //get open gl context
		gl = canvas.getContext("webgl");
		quadBuffer = gl.createBuffer();

        //create a buffer for a unit square
		gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
		let vertices =
		[
		-1.0,	-1.0,	0.0,	0.0,
		1.0, 	-1.0,	1.0,	0.0,
		-1.0,	1.0,	0.0,	1.0,
		1.0,	1.0,	1.0,	1.0
		];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		gl.clearColor(0,0,0,1);
		gl.disable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);

        camera = Vector2New(0,0);
        renderSize = Vector2New();

		updateViewport(canvas);

		currentShader = null;
	}


	export function drawCentered(t : Texture, pos : Vector2, depth : number = 0.0, size : Vector2 = t.size) : void
	{
		gl.bindTexture(gl.TEXTURE_2D, t.texture);
		gl.uniform1f(currentShader.uniforms["depth"],  depth);
		gl.uniform2f(currentShader.uniforms["size"],  size.x/2, size.y/2);
		gl.uniform2f(currentShader.uniforms["position"], pos.x - camera.x, pos.y - camera.y);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	export function drawCenteredTextureless(pos: Vector2, depth: number = 0.0, size: Vector2): void
	{
		gl.uniform1f(currentShader.uniforms["depth"], depth);
		gl.uniform2f(currentShader.uniforms["size"], size.x / 2, size.y / 2);
		gl.uniform2f(currentShader.uniforms["position"], pos.x - camera.x, pos.y - camera.y);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	export function drawCenteredScreenSpaceTextureless(pos: Vector2, depth: number = 0.0, size: Vector2): void
	{
		gl.uniform1f(currentShader.uniforms["depth"], depth);
		gl.uniform2f(currentShader.uniforms["size"], size.x / 2, size.y / 2);
		gl.uniform2f(currentShader.uniforms["position"], pos.x, pos.y);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	export function updateShader(s : Shader)
    {
        //update shader stuff: uniform, attributes and such

		if (currentShader != null)
		{
			let vt = currentShader.attributes["position"];
			if (vt >= 0)
        		gl.disableVertexAttribArray(vt);
        	vt = currentShader.attributes["texcoord"];
			if (vt >= 0)
        		gl.disableVertexAttribArray(vt);
		}
		currentShader = s;
		gl.useProgram(s.program);
		gl.uniform2f(s.uniforms["scale"], scale.x/2, -scale.y/2);
		gl.uniform2f(s.uniforms["renderSize"], renderSize.x, renderSize.y);
		gl.uniform1i(s.uniforms["texture"], 0);


		let vt = currentShader.attributes["position"];
		if (vt >= 0)
    		gl.enableVertexAttribArray(vt);
		vt = currentShader.attributes["texcoord"];
		if (vt >= 0)
    		gl.enableVertexAttribArray(vt);
		bindBuffer();
	}

	export function bindBuffer() : void
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
		bindAttributePointers();
	}

	export function bindAttributePointers() : void
	{

        let vt = currentShader.attributes["position"];
        if (vt >= 0)
			gl.vertexAttribPointer(vt, 2, gl.FLOAT, false, 4 * 4, 0);

		vt = currentShader.attributes["texcoord"];
        if (vt >= 0)
			gl.vertexAttribPointer(vt, 2, gl.FLOAT, false, 4 * 4, 4 * 2);

    }

    export function centerCameraOn(pos: Vector2): void {
        camera.x = pos.x - renderSize.x / 2;
        camera.y = pos.y - renderSize.y / 2;
    }

	export function update() : void
    {
        let curmap = tileMap.map;
        if (curmap)
        {
            let lowerLeft = Vector2Clone(camera);
            Vector2Add(lowerLeft, renderSize);
            let mapsize = Vector2Clone(curmap.sizeInTiles);
            Vector2ScalarMul(mapsize, curmap.tileSize);
            if (lowerLeft.x > mapsize.x)
                camera.x -= (lowerLeft.x - mapsize.x);
            if (lowerLeft.y > mapsize.y)
                camera.y -= (lowerLeft.y - mapsize.y);
            if (camera.x < 0)
                camera.x = 0;
            if (camera.y < 0)
                camera.y = 0;
        }
        //draw all gfx stuff

        //bind the "basic" shader
        updateShader(shaders["basic"]);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //and draw
		drawables.forEach(function(i)
		{
			if (i.visible)
				i.draw();
		});
	}

}

