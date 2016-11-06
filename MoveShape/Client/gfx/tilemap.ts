interface TileDef
{
	texture : Texture;
}
interface TileMapObject
{
	texture : Texture;
	position : Vector2;
	size : Vector2;
}

declare var TileMapImports: { [key: string]: string };
declare var TileMaps : {[key:string] : TileMap};
TileMaps = {};
TileMapImports = {};
TileMapImports["Overworld"] = "assets/map.json";


class TileMap implements AsyncLoadable
{
	private source: string;
	private name: string;
	public sizeInTiles : Vector2;
	public tileDefs : {[gid : string] : TileDef};
	public tiles : number[];
    public objects: TileMapObject[];
    public tileSize: number= 64;

	constructor(name : string, src : string)
	{
		this.sizeInTiles = Vector2New(0,0);
		this.name = name;
		this.source = src;
		this.tileDefs = {};
		this.objects = [];
	}

    getSourceName(): string {
        return "Tilemap " + this.name + " at " + this.source;
    }

	load(callback : (success: boolean) => void) : void
	{
		let us = this;

		let doTM = function(tm)
		{
            let name = tm.name;

            //only consider tilemaps with names
            //beginning with "terrain" 
            //TODO: properly handle object tilemaps
			if (name.slice(0,7) != "terrain")
                return;
			let firstGid = tm.firstgid;
			for (let key in tm.tiles)
			{
				if (!tm.tiles.hasOwnProperty(key))
					continue;

                let num = parseInt(key) + firstGid;

				let img = tm.tiles[key].image;
				img = img.slice(0,img.indexOf('.'));
				let tex = GFX.textures[img];
				us.tileDefs[num] = {texture: tex};
			}
		};

		let xht = new XMLHttpRequest();
		xht.open("GET",this.source,true);
		xht.overrideMimeType('text/plain');
		xht.onload = function()
        {
            try {
                //this.responseText should be valid JSON
                let jsondata = JSON.parse(this.responseText);

                //see the Tiled JSON export format

                us.sizeInTiles.x = jsondata.width;
                us.sizeInTiles.y = jsondata.height;
                for (let i = 0; i < jsondata.tilesets.length; i++) {
                    doTM(jsondata.tilesets[i]);
                }

                for (let i = 0; i < jsondata.layers.length; i++) {
                    let lay = jsondata.layers[i];
                    //TODO: check the corrects layers based on name
                    //instead of type
                    //TODO: properly handle object layers
                    if (lay.type != "tilelayer")
                        continue;
                    us.tiles = lay.data;
                }
                callback(true);
            }
            catch (e) {
                console.log(e);
                callback(false);
            }
		};
		xht.onerror = function()
		{
			callback(false);
		};
		xht.send();

	}
}

interface DrawableTileMapTexBuffer
{
	buffer: WebGLBuffer;
	texture: Texture;
	count: number;
}

class DrawableTileMap implements Drawable
{

	public map : TileMap;
	private buffers : DrawableTileMapTexBuffer[];


	public visible : boolean = true;

    constructor()
	{
		this.map = null;
		this.buffers = [];
	}

	public setMap(map : TileMap) : void
	{
        this.map = map;
        //clear the previous buffers
		for (var i = this.buffers.length - 1; i >= 0; i--) {
			GFX.gl.deleteBuffer(this.buffers[i].buffer);
		}
        this.buffers = [];

        if (!map)
            return;


        let determOff = function(x, y, scale)
        {
            let v = Vector2New(
                (10000 + Math.sin(x * 1.1311 + y * 11.411) * 10000) % 1, 
                (10000 + Math.sin(x * 14.389 + y * 1.5031) * 10000) % 1);
            v.x *= scale;
            v.x -= scale / 2;
            v.y *= scale;
            v.y -= scale / 2;
            return v;
        };

        //vertex arrays
		let tiles = <{[gid : string] : number[]}>{};
		let x = 0; 
		let y = 0;
		for (var i = map.tiles.length - 1; i >= 0; i--)
		{
			x = i % map.sizeInTiles.x;
			y = Math.floor(i / map.sizeInTiles.x);
			let gid = map.tiles[i];
			let type = map.tileDefs[gid];
			if (!type)
				continue;
			if (!(gid in tiles))
			{
				tiles[gid] = []
            }

            //How wonky you want your tilemaps?
            let wonkiness = 0;
            let p1 = determOff(x, y, wonkiness);
            let p2 = determOff(x + 1, y, wonkiness);
            let p3 = determOff(x, y + 1, wonkiness);
            let p4 = determOff(x + 1, y + 1, wonkiness);
			
            let base = Vector2New(x, y);
            let ts = map.tileSize; //tile size
			Vector2ScalarMul(base,ts);

            //two triangles
            tiles[gid].push(base.x + p1.x, base.y + p1.x,0,0);
            tiles[gid].push(base.x + ts + p2.x, base.y + p2.x,1.0,0);
            tiles[gid].push(base.x + p3.x, base.y + ts + p3.x, 0, 1.0);

            tiles[gid].push(base.x + p3.x, base.y + ts + p3.x,0,1.0);
            tiles[gid].push(base.x + ts + p2.x, base.y + p2.x,1.0,0);
            tiles[gid].push(base.x + ts + p4.x, base.y + ts + p4.x,1.0,1.0);
		}

		for (let gid in tiles)
		{
			if (!tiles.hasOwnProperty(gid))
				continue;
			let arr = tiles[gid];
			let buf = {buffer: null, texture: map.tileDefs[gid].texture, count: arr.length / 4};
			buf.buffer = GFX.gl.createBuffer();
			
			GFX.gl.bindBuffer(GFX.gl.ARRAY_BUFFER, buf.buffer);
       		GFX.gl.bufferData(GFX.gl.ARRAY_BUFFER, new Float32Array(arr), GFX.gl.STATIC_DRAW);

       		this.buffers.push(buf);
		}

	}

	public draw() : void
	{
		let sb = new ShaderBinder();
		sb.useShader(GFX.shaders["map"]);

		let gl = GFX.gl;
		for (let i = 0; i < this.buffers.length; i++)
		{
			let buf = this.buffers[i];

			gl.bindBuffer(gl.ARRAY_BUFFER, buf.buffer);
			GFX.bindAttributePointers();
			gl.bindTexture(gl.TEXTURE_2D, buf.texture.texture);
			gl.uniform1f(GFX.currentShader.uniforms["depth"],  0.8);
			gl.uniform2f(GFX.currentShader.uniforms["position"], -GFX.camera.x,-GFX.camera.y);
			gl.drawArrays(gl.TRIANGLES, 0, buf.count);

		}
		GFX.bindBuffer();
		sb.restoreShader();
	}
}