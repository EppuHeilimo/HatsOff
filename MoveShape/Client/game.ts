

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

        keyMap[65] = "left";
        keyMap[87] = "up";
        keyMap[68] = "right";
        keyMap[83] = "down";


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

    constructor() {
        this.speed = 8;
        this.position = Vector2New(0, 0);
        this.sprite = new DrawableTextureBox();
        this.sprite.texture = GFX.textures["hat1"];
        this.sprite.size.x = 64;
        this.sprite.size.y = 64;
        this.sprite.depth = -0.9;
        this.text = new DrawableText();
        this.text.setTexture(GFX.textures["font1"]);
        this.text.depth = -1;

    }
    public teleport(pos: Vector2): void {
        this.position = Vector2Clone(pos);
    }

    public init(): void {
        GFX.addDrawable(this.sprite);
        GFX.addDrawable(this.text);
    }

    public deinit(): void {
        GFX.removeDrawable(this.sprite);
        GFX.removeDrawable(this.text);
    }

    public update(): void {
       
        this.text.position.x = this.position.x;
        this.text.position.y = this.position.y - 30;
    }
}

class InterpolatedPlayerClient extends PlayerClient {
    public lastPosition: Vector2;
    constructor() {
        super()
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

class LocalPlayerClient extends PlayerClient {
    public moved: boolean;
    public activated: boolean;
    constructor() {
        super();

    }

    public update(): void {
        let vel = Vector2New(0,0)
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
        if (Game.keyStates["activate"] == KeyState.Pressed)
        {
            this.activated = true;
        }
        super.update();
        GFX.centerCameraOn(this.position);
    }
}