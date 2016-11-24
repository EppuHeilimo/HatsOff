interface TileDef
{
	texture : Texture;
}
interface TileMapObject
{
	texture : Texture;
	position : Vector2;
    size: Vector2;
    depth: Number;
}

declare var TileMapImports: { [key: string]: string };
declare var TileMaps : {[key:string] : TileMap};
TileMaps = {};
TileMapImports = {};
TileMapImports["Overworld"] = "assets/overworld.json";
TileMapImports["Town"] = "assets/smalltown.json";


class TileMap implements AsyncLoadable
{
	private source: string;
	private name: string;
	public sizeInTiles : Vector2;
	public tileDefs : {[gid : string] : TileDef};
	public tiles : number[];
    public collision: boolean[];
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

    getTileIndex(p: Vector2): number {
        if (p.x < 0)
            return -1;
        if (p.y < 0)
            return -1;
        if (p.x >= this.sizeInTiles.x)
            return -1;
        if (p.y >= this.sizeInTiles.y)
            return -1;
        return p.x + p.y * this.sizeInTiles.x;
    }

	load(callback : (success: boolean) => void) : void
	{
        let us = this;
        us.objects = [];
        us.tileDefs = {};
        us.tiles = [];
        us.collision = [];

		let doTM = function(tm)
		{
            let name = tm.name;

            //only consider tilemaps with names
            //beginning with "terrain" 
            //TODO: properly handle object tilemaps
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

        let doObjects = function (tm) {
            let depth = 0
            if (tm.name == "canopy") {
                depth = 1
            }
            for (let objk in tm.objects) {
                
                let obj = tm.objects[objk]
                let md = <TileMapObject>{};
                md.position = { x: obj.x + obj.width / 2, y: obj.y - obj.height / 2 };
                md.size = { x: obj.width, y: obj.height };
                md.depth = depth
                let td = us.tileDefs[obj.gid];
                if (td)
                    md.texture = td.texture;
                else {
                    md.texture = null;
                }
                us.objects.push(md);
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
                us.collision = new Array(us.sizeInTiles.x * us.sizeInTiles.y);
                us.tiles = [];
				for (let i = 0; i < us.collision.length; i++)
					us.collision[i] = false;
				
                for (let i = 0; i < jsondata.layers.length; i++) {
                    let lay = jsondata.layers[i];
                    //TODO: check the corrects layers based on name
                    //instead of type
                    //TODO: properly handle object layers
                    if (lay.type == "tilelayer") {
                        if (lay.name == "terrain") {
                            us.tiles = lay.data;
                        }
                        else if (lay.name == "collision") {
                            for (let i = 0; i < us.collision.length; i++)
                                us.collision[i] = (lay.data[i] > 0);
                        }
                    }
                    else if (lay.type == "objectgroup") {
                        doObjects(lay);
                    }
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
    private buffers: DrawableTileMapTexBuffer[];
    private drawables: Drawable[];


	public visible : boolean = true;

    constructor()
	{
		this.map = null;
        this.buffers = [];
        this.drawables = [];
	}

	public setMap(map : TileMap) : void
	{
        this.map = map;
        //clear the previous buffers
        for (let i = this.buffers.length - 1; i >= 0; i--) {
			GFX.gl.deleteBuffer(this.buffers[i].buffer);
        }

        for (let i = 0; i < this.drawables.length; i++)
        {
            GFX.removeDrawable(this.drawables[i]);
        }
        this.drawables = [];
        this.buffers = [];

        if (!map)
            return;


        let determOff = function(x, y, scale, depth? :number )
        {
            
            depth = (depth >= 0) ? depth : 4;
            let v = Vector2New(
                (123456 + Math.sin((x * 433113.11 + 15733) + (y * 114.11 + 234)) * 123456) % 1, 
                (123456 + Math.sin((x * 9143.89 + 77.33) + (y * 87150.31 + 0.435)) * 123456) % 1);
            v.x *= scale;
            v.x -= scale / 2;
            v.y *= scale;
            v.y -= scale / 2;
            if (depth > 1)
                return determOff(v.y, v.x, scale, depth - 1);
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
            let wonkiness = 16;
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

        for (let i = 0; i < map.objects.length; i++) {
            let obj = map.objects[i];
            let drw = new DrawableTextureBox();
            
            drw.texture = obj.texture;
            drw.position = obj.position;
            drw.size = obj.size;
            if (obj.depth == 0)
                drw.depth = 0.780
            else
                drw.depth = -0.480
            
            GFX.addDrawable(drw);
            this.drawables.push(drw);
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
            gl.uniform1f(GFX.currentShader.uniforms["depth"], 0.8);
            gl.uniform2f(GFX.currentShader.uniforms["position"], -GFX.camera.x, -GFX.camera.y);
            gl.drawArrays(gl.TRIANGLES, 0, buf.count);

		}
		GFX.bindBuffer();
		sb.restoreShader();
	}
}