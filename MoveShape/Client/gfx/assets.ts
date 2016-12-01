interface TextureSource
{
	source : string;
	isPowerOfTwo : boolean;
}

interface ShaderSource
{
	vert : string;
	frag : string;
}

declare var TextureImports : {[key:string] : TextureSource};
TextureImports = 
{
    "font1": { "source": "assets/font1.png", "isPowerOfTwo": false },
    "castle1": { "source": "assets/graphics/castle1.png", "isPowerOfTwo": false },
    "castle": { "source": "assets/graphics/castle.png", "isPowerOfTwo": false },
    "docks": { "source": "assets/graphics/docks.png", "isPowerOfTwo": false },

    "townexit": { "source": "assets/graphics/townexit.png", "isPowerOfTwo": false },
    "citywall": { "source": "assets/graphics/citywall.png", "isPowerOfTwo": false },
    "cottage1": { "source": "assets/graphics/cottage.png", "isPowerOfTwo": false },
    "hat1": { "source": "assets/graphics/hat/tophat.png", "isPowerOfTwo": true },
    "peasant_hat": { "source": "assets/graphics/hat/peasant_hat.png", "isPowerOfTwo": true },
    "furhat": { "source": "assets/graphics/hat/furhat.png", "isPowerOfTwo": true },

    "tree1": { "source": "assets/graphics/tree1.png", "isPowerOfTwo": false },
    "tree2": { "source": "assets/graphics/tree2.png", "isPowerOfTwo": false },
    "tree3": { "source": "assets/graphics/tree3.png", "isPowerOfTwo": false },

    "cottage": { "source": "assets/graphics/cottage.png", "isPowerOfTwo": false },

    "bigforest": { "source": "assets/graphics/bigforest.png", "isPowerOfTwo": true },
    "smallforest": { "source": "assets/graphics/smallforest.png", "isPowerOfTwo": true },
    "rock": { "source": "assets/graphics/rock.png", "isPowerOfTwo": true },

    "deepwater": { "source": "assets/graphics/deepwater.png", "isPowerOfTwo": true },
    "dirtroad": { "source": "assets/graphics/dirtroad.png", "isPowerOfTwo": true },
    "grass": { "source": "assets/graphics/grass.png", "isPowerOfTwo": true },
    "sand": { "source": "assets/graphics/sand.png", "isPowerOfTwo": true },
    "shallowwater": { "source": "assets/graphics/shallowwater.png", "isPowerOfTwo": true },

    "woodenbridge": { "source": "assets/graphics/woodenbridge.png", "isPowerOfTwo": true },
    "woodenfloor": { "source": "assets/graphics/woodenfloor.png", "isPowerOfTwo": true },
    "wooden_door": { "source": "assets/graphics/wooden_door.png", "isPowerOfTwo": true },
    "woodenwall": { "source": "assets/graphics/woodenwall.png", "isPowerOfTwo": true },
	
	
    "physical": { "source": "assets/graphics/attributes/physical.png", "isPowerOfTwo": true },
    "fire": { "source": "assets/graphics/attributes/fire.png", "isPowerOfTwo": true },
    "water": { "source": "assets/graphics/attributes/water.png", "isPowerOfTwo": true },
    "earth": { "source": "assets/graphics/attributes/earth.png", "isPowerOfTwo": true },
    "air": { "source": "assets/graphics/attributes/air.png", "isPowerOfTwo": true },
    "dark": { "source": "assets/graphics/attributes/dark.png", "isPowerOfTwo": true },
    "holy": { "source": "assets/graphics/attributes/holy.png", "isPowerOfTwo": true }
};

declare var ShaderImports : {[key:string] : ShaderSource};
ShaderImports = 
{
	"basic":
	{
        "vert":"assets/shaders/basic.vs",
        "frag":"assets/shaders/basic.fs"
	},
	"negative":
	{
        "vert":"assets/shaders/basic.vs",
        "frag":"assets/shaders/inverted.fs"
	},
	"text":
	{
        "vert":"assets/shaders/font.vs",
        "frag":"assets/shaders/font.fs"
	},
	"map":
	{
        "vert":"assets/shaders/map.vs",
        "frag":"assets/shaders/basic.fs"
	},
	"colored":
	{
        "vert":"assets/shaders/basic.vs",
        "frag":"assets/shaders/colored.fs"
	}
};

declare var ShaderUniforms : {[key:string] : string};
ShaderUniforms = 
{
	"texture":"u_Texture",
	"scale":"u_Scale",
	"renderSize":"u_RenderSize",
	"size":"u_Size",
	"position":"u_Position",
	"depth":"u_Depth",
	"charindex":"u_CharIndex",
	"color":"u_Color"
};

declare var ShaderAttributes : {[key:string] : string};
ShaderAttributes = 
{
	"position" : "v_Position",
	"texcoord" : "v_TexCoord"
};

class Texture implements AsyncLoadable
{
	private source: string;
	private name: string;
	private isPowerOfTwo : boolean;
	public loaded : boolean;
	public image: any;
	public texture: any;
	public size: Vector2;
	constructor(name : string, src : string, ip2 : boolean)
	{
		this.loaded = false;
		this.name = name;
		this.source = src;
		this.isPowerOfTwo = ip2;
		this.size = Vector2New(0,0);
		this.texture = 0;
	}
    getSourceName(): string {
        return "Texture " + this.name + " at " + this.source;
    }
	load(callback : (success: boolean) => void) : void
	{
		this.image = new Image();
		let str = "Loaded image "+this.name+":"+this.source;
		let imstr = this.name+":"+this.source;
		let us = this;
		this.image.onerror = function()
		{
			
			callback(false);
		}
		this.image.onload = function()
		{
			us.texture = GFX.gl.createTexture();
			us.loaded = true;
			GFX.gl.bindTexture(GFX.gl.TEXTURE_2D, us.texture);
            GFX.gl.texImage2D(GFX.gl.TEXTURE_2D, 0, GFX.gl.RGBA, GFX.gl.RGBA, GFX.gl.UNSIGNED_BYTE, us.image);
            GFX.gl.texParameteri(GFX.gl.TEXTURE_2D, GFX.gl.TEXTURE_MAG_FILTER, GFX.gl.NEAREST);
			
			//GFX.gl.generateMipmap(GFX.gl.TEXTURE_2D);

			if (us.isPowerOfTwo)
			{
				GFX.gl.texParameteri(GFX.gl.TEXTURE_2D, GFX.gl.TEXTURE_MIN_FILTER, GFX.gl.NEAREST_MIPMAP_NEAREST);
				GFX.gl.texParameteri(GFX.gl.TEXTURE_2D, GFX.gl.TEXTURE_WRAP_T, GFX.gl.REPEAT);
				GFX.gl.texParameteri(GFX.gl.TEXTURE_2D, GFX.gl.TEXTURE_WRAP_S, GFX.gl.REPEAT);
				GFX.gl.generateMipmap(GFX.gl.TEXTURE_2D);
			}
			else
			{
				GFX.gl.texParameteri(GFX.gl.TEXTURE_2D, GFX.gl.TEXTURE_MIN_FILTER, GFX.gl.NEAREST);
				GFX.gl.texParameteri(GFX.gl.TEXTURE_2D, GFX.gl.TEXTURE_WRAP_T, GFX.gl.CLAMP_TO_EDGE);
				GFX.gl.texParameteri(GFX.gl.TEXTURE_2D, GFX.gl.TEXTURE_WRAP_S, GFX.gl.CLAMP_TO_EDGE);
			}
			GFX.gl.bindTexture(GFX.gl.TEXTURE_2D, null);

            us.size = Vector2New(us.image.width, us.image.height);

			callback(true);
		};
		this.image.src = this.source;
	}
}



class Shader implements AsyncLoadable
{
	private sourceVert: string;
	private sourceFrag: string;
	private name: string;
	private vertLoaded : boolean;
	private fragLoaded : boolean;
	public program: any;
	public shaderFrag: any;
	public shaderVert: any;
	public uniforms: {[key : string] : WebGLUniformLocation};
	public attributes: {[key : string] : number};
	constructor(name : string, srcv : string, srcf : string)
	{
		this.name = name;
		this.sourceVert = srcv;
		this.sourceFrag = srcf;
	}

    getSourceName(): string {
        return "Shader " + this.name + " at " + this.sourceFrag + " & " + this.sourceVert;
    }
	load(callback : (success: boolean) => void) : void
	{
		let us = this;
		let str = "Loaded shader "+this.name+":"+this.sourceFrag+" & "+this.sourceVert;

		this.vertLoaded = false;
		this.fragLoaded = false;

		this.uniforms = {};
		this.attributes = {};

		function bothLoad()
        {
            try 
            {
			    us.program = GFX.gl.createProgram();
        	    GFX.gl.attachShader(us.program, us.shaderVert);
        	    GFX.gl.attachShader(us.program, us.shaderFrag);
        	    GFX.gl.linkProgram(us.program);


        	    for (var key in ShaderUniforms)
			    {
			        if (!ShaderUniforms.hasOwnProperty(key)) continue;

			        us.uniforms[key] = GFX.gl.getUniformLocation(us.program,ShaderUniforms[key]);
			    }

			    for (var key in ShaderAttributes)
			    {
			        if (!ShaderAttributes.hasOwnProperty(key)) continue;

			        us.attributes[key] = GFX.gl.getAttribLocation(us.program,ShaderAttributes[key]);
			    }

                callback(true);
            }
            catch (e) {
                console.log(e);
                callback(false);
            }
		}


		let xht = new XMLHttpRequest();
		xht.open("GET",this.sourceFrag,true);
		xht.overrideMimeType('text/plain');
		xht.onload = function()
		{
			us.shaderFrag = GFX.gl.createShader(GFX.gl.FRAGMENT_SHADER);
			GFX.gl.shaderSource(us.shaderFrag, this.responseText);
        	GFX.gl.compileShader(us.shaderFrag);
        	if (!GFX.gl.getShaderParameter(us.shaderFrag, GFX.gl.COMPILE_STATUS))
        	{
	            console.log(GFX.gl.getShaderInfoLog(us.shaderFrag));
	        }

			us.fragLoaded = true;
        	if (us.vertLoaded)
        		bothLoad();

		};
		xht.send();

		xht = new XMLHttpRequest();
		xht.open("GET",this.sourceVert,true);
		xht.overrideMimeType('text/plain');
		xht.onload = function()
		{
			us.shaderVert = GFX.gl.createShader(GFX.gl.VERTEX_SHADER);
			GFX.gl.shaderSource(us.shaderVert, this.responseText);
        	GFX.gl.compileShader(us.shaderVert);
        	if (!GFX.gl.getShaderParameter(us.shaderVert, GFX.gl.COMPILE_STATUS))
        	{
	            console.log(GFX.gl.getShaderInfoLog(us.shaderVert));
	        }

			us.vertLoaded = true;
        	if (us.fragLoaded)
        		bothLoad();

		};

		xht.send();
	}
}
