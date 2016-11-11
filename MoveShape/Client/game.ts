

interface GameActor {
    update(): void;
    init(): void;
    deinit(): void;
}

enum KeyState {
    Up = 0,
    Down = 1,
    Pressed = 2,
    Released = -1
}



namespace Game {

    export declare var time: number;
    export declare var actors: Set<GameActor>;
    export declare var keyMap: { [keyid: number]: string; }
    export declare var keyStates: { [keyid: number]: KeyState; }
    export declare var nextMap: string;
    

	export function testMapCollision(center : Vector2, size : Vector2) : BoxCollisionResult
    {
        let cnt = Vector2Clone(center);
		let b = {offset: {x:0,y:0}, found: false};
        if (cnt.x - size.x / 2 < 0)
		{
            b.offset.x = (cnt.x - size.x / 2);
            b.found = true;
		}
		
        if (cnt.y - size.y / 2 < 0)
		{
            b.offset.y = (cnt.y - size.y / 2);
            b.found = true;
        }
		
		if (GFX.tileMap.map)
		{
			let map = GFX.tileMap.map;
			let mapx = map.sizeInTiles.x * map.tileSize;
			let mapy = map.sizeInTiles.y * map.tileSize;
            if (cnt.x + size.x / 2 > mapx)
			{
                b.offset.x = (cnt.x + size.x / 2) - mapx;
				b.found = true;
			}
			
            if (cnt.y + size.y / 2 > mapy)
			{
                b.offset.y = (cnt.y + size.y / 2) - mapy;
				b.found = true;
            }

            Vector2Sub(cnt, b.offset);
			let tryMatrix = <Vector2[]>[];
			
			tryMatrix.push(Vector2New(0,0));
			tryMatrix.push(Vector2New(1,0));
			tryMatrix.push(Vector2New(0,1));
			tryMatrix.push(Vector2New(-1,0));
			tryMatrix.push(Vector2New(0,-1));
			tryMatrix.push(Vector2New(1,1));
			tryMatrix.push(Vector2New(-1,-1));
			tryMatrix.push(Vector2New(1,-1));
			tryMatrix.push(Vector2New(-1,1));
            
			
            let base = { x: Math.floor(cnt.x / map.tileSize), y: Math.floor(cnt.y / map.tileSize)};
			for (let i = 0; i < tryMatrix.length; i++)
			{
				let vs = tryMatrix[i];
				let cm = Vector2Clone(base);
				Vector2Add(cm, vs);
				let ind = map.getTileIndex(cm);
				if (ind == -1 || map.collision[ind])
				{
					Vector2ScalarMul(cm, map.tileSize);
					cm.x += map.tileSize / 2;
					cm.y += map.tileSize / 2;
                    let res = Collision.testBoxCollision(cnt, size, cm, { x: map.tileSize, y: map.tileSize });
                    (<any>res).fjhh = vs;
                    (<any>res).ffjhh = cm;
                    
                    if (res.found) {
                        b.found = true;
                        Vector2Add(b.offset, res.offset);
                        Vector2Sub(cnt, res.offset)
                    }
				}
			}
		}
		return b;
	}
    export function changeMap(map: string) {
        nextMap = map;
    }

    export function removeActor(act: GameActor) {
        act.deinit();
        actors.delete(act);
    }

    export function addActor(act: GameActor) {
        act.init();
        actors.add(act);
    }

    export function start(): void {
        actors = new Set<GameActor>();
        time = 0;
        nextMap = null;

        keyMap = {};
        keyMap[37] = "left";
        keyMap[38] = "up";
        keyMap[39] = "right";
        keyMap[40] = "down";

        keyMap[32] = "activate";
        keyMap[8] = "say";

        keyMap[65] = "left";
        keyMap[87] = "up";
        keyMap[68] = "right";
        keyMap[83] = "down";

        keyMap[16] = "shift";
        keyMap[13] = "enter";

        /*
        keyMap[48] = "0";
        keyMap[49] = "1";
        keyMap[50] = "2";
        keyMap[51] = "3";
        keyMap[52] = "4";
        keyMap[53] = "5";
        keyMap[54] = "6";
        keyMap[55] = "7";
        keyMap[56] = "8";
        keyMap[57] = "9";

        keyMap[65] = "a";
        keyMap[66] = "b";
        keyMap[67] = "c";
        keyMap[68] = "d";
        keyMap[69] = "e";
        keyMap[70] = "f";
        keyMap[71] = "g";
        keyMap[72] = "h";
        keyMap[73] = "í";
        keyMap[74] = "j";
        keyMap[75] = "k";
        keyMap[76] = "l";
        keyMap[77] = "m";
        keyMap[78] = "n";
        keyMap[79] = "o";
        keyMap[80] = "p";
        keyMap[81] = "q";
        keyMap[82] = "r";
        keyMap[83] = "s";
        keyMap[84] = "t";
        keyMap[85] = "u";
        keyMap[86] = "v";
        keyMap[87] = "w";
        keyMap[88] = "x";
        keyMap[89] = "y";
        keyMap[90] = "z";
        */
        keyStates = {};
        for (var k in keyMap) {
            if (keyMap.hasOwnProperty(k)) {
                keyStates[keyMap[k]] = KeyState.Up;
            }
        }
        window.addEventListener("keydown", function (ev) {
            if (ev.keyCode in keyMap) {
                var v = keyMap[ev.keyCode];
                keyStates[v] = KeyState.Pressed;
            }
            if (Chat.chatactivated) {
                if (ev.key.length === 1) {
                    if (ev.shiftKey)
                        Chat.addKeyToCurrentMessage(ev.key, true);
                    else
                        Chat.addKeyToCurrentMessage(ev.key, false);       
                }
                else if (ev.keyCode === 8) {
                    Chat.deleteLastKeyFromCurrentMessage();
                }
            }
        }, false);

        window.addEventListener("keyup", function (ev) {
            if (ev.keyCode in keyMap) {
                var v = keyMap[ev.keyCode];
                keyStates[v] = KeyState.Released;
            }
        }, false);

    }

    export function update(): void {
        if (nextMap) {
            GFX.tileMap.setMap(TileMaps[nextMap]);
            nextMap = null;
        }
        time += 1;
        actors.forEach(function (i) {
            i.update();
        });
        for (var k in keyStates) {
            if (keyStates.hasOwnProperty(k)) {
                let v = keyStates[k];
                if (v == KeyState.Released)
                    keyStates[k] = KeyState.Up;
                if (v == KeyState.Pressed)
                    keyStates[k] = KeyState.Down;
            }
        }
    }
}



class PlayerClient implements GameActor {
    public position: Vector2;
    public sprite: DrawableTextureBox;
    public id: number;
    public speed: number;
    public text: DrawableText;
    public health: number;
    public attack: number;

    constructor() {
        this.health = 100;
        this.attack = 10;
        this.speed = 8;
        this.position = Vector2New(0, 0);
        this.sprite = new DrawableTextureBox();
        this.sprite.texture = GFX.textures["hat1"];
        this.sprite.size.x = 64;
        this.sprite.size.y = 64;
        this.sprite.depth = -0.9;
        this.text = new DrawableText();
        this.text.text = "Test";
        this.text.setTexture(GFX.textures["font1"]);
        this.text.depth = -1;

    }
    public teleport(pos: Vector2): void {
        this.position = Vector2Clone(pos);
    }

    public init(): void {
        GFX.addDrawable(this.sprite);
        GFX.addDrawable(this.text, Layer.LayerAlpha);
    }

    public deinit(): void {
        GFX.removeDrawable(this.sprite);
        GFX.removeDrawable(this.text);
    }

    public showmessage(mes: string): void
    {
        this.text.text = mes;
        setTimeout(function () { this.text.text = ""; }, 2000);
    }

    public update(): void {
        this.text.position.x = this.position.x - 25;
        this.text.position.y = this.position.y - 50;
    }
}

class InterpolatedPlayerClient extends PlayerClient {
    public lastPosition: Vector2;
    constructor() {
        super();
        this.lastPosition = Vector2New(0, 0);
    }
    

    public init(): void {
        GFX.addDrawable(this.sprite);
    }

    public deinit(): void {
        GFX.removeDrawable(this.sprite);
    }
    public teleport(pos: Vector2): void {
        this.position = Vector2Clone(pos);
        this.lastPosition = Vector2Clone(pos);
    }


    public update(): void {
        let diff = Vector2Clone(this.position);
        Vector2Sub(diff, this.lastPosition)
        let len = Vector2Length(diff);
        if (len > this.speed) {
            Vector2Normalize(diff);
            Vector2ScalarMul(diff, this.speed);
            Vector2Add(this.lastPosition, diff);
            this.sprite.position = Vector2Clone(this.lastPosition);
            this.sprite.position.y -= Math.abs(Math.sin(Game.time / 4) * 10);
        }
        else {
            this.lastPosition = this.position;
            this.sprite.position = this.lastPosition;

        }
        super.update();
    }
}

class EnemyNpc implements GameActor {
    public position: Vector2;
    public sprite: DrawableTextureBox;
    public text: DrawableText;
    public health: number;
    public attack: number;

    constructor(x: number, y: number, attack: number, health: number) {
        this.position = Vector2New(x,y);
        this.sprite = new DrawableTextureBox();
        this.sprite.texture = GFX.textures["hat1"];
        this.sprite.size.x = 64;
        this.sprite.size.y = 64;
        this.sprite.position = Vector2New(x, y);
        this.sprite.depth = -0.9;
        this.text = new DrawableText();
        this.text.text = "Health: " + this.health;
        this.text.setTexture(GFX.textures["font1"]);
        this.text.depth = -1;
        this.health = health;
        this.attack = attack;

    }

    public teleport(pos: Vector2): void {
        this.position = Vector2Clone(pos);
    }

    public init(): void {
        GFX.addDrawable(this.sprite);
        GFX.addDrawable(this.text, Layer.LayerAlpha);
    }

    public deinit(): void {
        GFX.removeDrawable(this.sprite);
        GFX.removeDrawable(this.text);
    }

    public showmessage(mes: string): void {
        this.text.text = mes;
        setTimeout(function () { this.text.text = ""; }, 2000);
    }

    public update(): void {
        this.text.position.x = this.position.x - 25;
        this.text.position.y = this.position.y - 50;
    }
}

class LocalPlayerClient extends PlayerClient {
    public moved: boolean;
    public activated: boolean;
    public sentMessage: boolean;
    constructor() {
        super();

    }

    public update(): void {
        if (!Chat.chatactivated)
        {
            if (!Battle.active) {
                let vel = Vector2New(0, 0)
                if (Game.keyStates["up"]) {
                    vel.y -= 1;
                    this.moved = true;
                }
                if (Game.keyStates["down"]) {
                    vel.y += 1;
                    this.moved = true;
                }
                if (Game.keyStates["left"]) {
                    vel.x -= 1;
                    this.moved = true;
                }
                if (Game.keyStates["right"]) {
                    vel.x += 1;
                    this.moved = true;
                }
                if (Vector2Length(vel) > 0) {
                    Vector2Normalize(vel);
                    Vector2ScalarMul(vel, this.speed);
                    Vector2Add(this.position, vel);

                    this.sprite.position = Vector2Clone(this.position);
                    this.sprite.position.y -= Math.abs(Math.sin(Game.time / 4) * 10);
                }
                else
                    this.sprite.position = Vector2Clone(this.position);

                if (this.moved) {
                    let coll = Game.testMapCollision(this.position, { x: 32, y: 32 });
                    if (coll.found) {
                        console.log(coll)
                        this.position.x -= coll.offset.x;
                        this.position.y -= coll.offset.y;

                    }
                }

                if (Game.keyStates["activate"] == KeyState.Pressed) {
                    this.activated = true;
                }
            }
            else
            {
                if (Game.keyStates["activate"] == KeyState.Pressed) {
                    Battle.attack();
                }
            }
        }
       
        if (Game.keyStates["enter"] == KeyState.Pressed) {
            if (Chat.chatactivated) {        
                Chat.sendCurrentMessage();       
                Chat.deactivateChat();
            } else {
                Chat.clearCurrentMessage();
                Chat.showchat();
                Chat.chatactivated = true;
            }
            
        }
        
        super.update();
        GFX.centerCameraOn(this.position);
    }
}