

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
    export declare var actors: Set<GameActor>;
    export declare var keyMap: { [keyid: number]: string; }
    export declare var keyStates: { [keyid: number]: KeyState; }

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


        keyMap = {};
        keyMap[37] = "left";
        keyMap[38] = "up";
        keyMap[39] = "right";
        keyMap[40] = "down";

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
    public sprite: DrawableColorBox;
    public id: number;

    constructor() {
        this.position = Vector2New(0, 0);
        this.sprite = new DrawableColorBox();
        this.sprite.size.x = 50;
        this.sprite.size.y = 50;
        this.sprite.color.r = 0.7;
        this.sprite.color.g = 0.7;

    }

    public init(): void {
        GFX.addDrawable(this.sprite);
    }

    public deinit(): void {
        GFX.removeDrawable(this.sprite);
    }

    public update(): void {
        this.sprite.position = this.position;
    }
}

class LocalPlayerClient extends PlayerClient {
    public moved: boolean;
    constructor() {
        super();

        this.sprite.color.g = 1.0;
    }

    public update(): void {
        if (Game.keyStates["up"]) {
            this.position.y -= 2;
            this.moved = true;
        }
        if (Game.keyStates["down"]) {
            this.position.y += 2;
            this.moved = true;
        }
        if (Game.keyStates["left"]) {
            this.position.x -= 2;
            this.moved = true;
        }
        if (Game.keyStates["right"]) {
            this.position.x += 2;
            this.moved = true;
        }

        super.update();
    }
}