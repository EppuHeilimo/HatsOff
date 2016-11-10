class AsyncLoader {
    constructor() {
        this.loading = false;
        this.loaded = 0;
        this.targets = [];
    }
    getProgress() {
        if (!this.loading)
            return 0.0;
        else {
            if (this.targets.length == 0)
                return 1.0;
            return this.loaded / this.targets.length;
        }
    }
    finishLoad(success) {
        this.loaded++;
        //gameLog(this.getProgress()*100,"% done");
    }
    addElement(asl) {
        if (this.loading)
            throw "Cannot add elements when load is already initiated";
        this.targets.push(asl);
    }
    startLoad() {
        this.loading = true;
        for (let i = 0; i < this.targets.length; i++) {
            var us = this;
            let loadCallBackGen = function (ist) {
                var nowThis = ist;
                return function (success) {
                    if (success == false)
                        console.log("Failed to load", nowThis.getSourceName());
                    us.finishLoad(true);
                };
            };
            setTimeout(function (target, callBack) {
                target.load(callBack);
            }, 0, this.targets[i], loadCallBackGen(this.targets[i]));
        }
    }
    isDone() {
        if (this.loaded >= this.targets.length)
            return true;
        return false;
    }
}
var Chat;
(function (Chat) {
    function newMessage(message) {
        let temp = Array();
        for (let i = 0; i < Chat.messages.length; i++) {
            temp.push(Chat.messages[i].text);
        }
        for (let i = 0; i < Chat.messages.length - 1; i++) {
            Chat.messages[i + 1].text = temp[i];
        }
        Chat.messages[0].text = message;
        console.log(message);
    }
    Chat.newMessage = newMessage;
    function windowResize() {
        Chat.currentmessage.position.y = window.innerHeight - 25;
        for (let i = 0; i < Chat.messages.length; i++) {
            Chat.messages[i].position.y = window.innerHeight - 50 - i * 20;
        }
    }
    Chat.windowResize = windowResize;
    function init() {
        Chat.messages = new Array();
        Chat.messageindex = 0;
        for (let i = 0; i < 10; i++) {
            let mes = new DrawableText();
            mes.setTexture(GFX.textures["font1"]);
            mes.depth = -1;
            mes.characterScale = 2;
            mes.position.y = window.innerHeight - 50 - i * 20;
            mes.position.x = 20;
            mes.screenSpace = true;
            mes.text = "";
            GFX.addDrawable(mes);
            this.messages.push(mes);
        }
        Chat.chatactivated = false;
        Chat.currentmessage = new DrawableText();
        Chat.currentmessage.setTexture(GFX.textures["font1"]);
        Chat.currentmessage.depth = -1;
        Chat.currentmessage.characterScale = 2;
        Chat.currentmessage.position.y = window.innerHeight - 25;
        Chat.currentmessage.position.x = 20;
        Chat.currentmessage.screenSpace = true;
        Chat.currentmessage.text = "Press enter to chat";
        GFX.addDrawable(Chat.currentmessage);
        Chat.sentmessage = false;
        Chat.initialized = true;
    }
    Chat.init = init;
    function clearCurrentMessage() {
        Chat.currentmessage.text = "";
    }
    Chat.clearCurrentMessage = clearCurrentMessage;
    function sendCurrentMessage() {
        if (Chat.currentmessage.text.length > 0) {
            Chat.lastmessage = Chat.currentmessage.text;
            Chat.sentmessage = true;
            Chat.currentmessage.text = "Press enter to chat";
        }
    }
    Chat.sendCurrentMessage = sendCurrentMessage;
    function addKeyToCurrentMessage(char, capitalized) {
        if (capitalized) {
            Chat.currentmessage.text = Chat.currentmessage.text + char.toUpperCase();
        }
        else {
            Chat.currentmessage.text = Chat.currentmessage.text + char;
        }
    }
    Chat.addKeyToCurrentMessage = addKeyToCurrentMessage;
    function deleteLastKeyFromCurrentMessage() {
        Chat.currentmessage.text = Chat.currentmessage.text.slice(0, -1);
    }
    Chat.deleteLastKeyFromCurrentMessage = deleteLastKeyFromCurrentMessage;
    function clear() {
        for (let i = 0; i < Chat.messages.length; i++) {
            Chat.messages[i].text = "";
        }
        Chat.messageindex = 0;
    }
    Chat.clear = clear;
})(Chat || (Chat = {}));
var Collision;
(function (Collision) {
    function testBoxCollision(center1, size1, center2, size2) {
        let delta = Vector2Clone(center2);
        Vector2Sub(delta, center1);
        let csize = Vector2Clone(size1);
        Vector2Add(csize, size2);
        Vector2ScalarDiv(csize, 2);
        let delta2 = Vector2Clone(delta);
        delta2.x = Math.abs(delta2.x);
        delta2.y = Math.abs(delta2.y);
        Vector2Sub(delta2, csize);
        let result = { offset: { x: 0, y: 0 }, found: false };
        if (delta2.x <= 0 && delta2.y <= 0) {
            result.found = true;
            if (delta2.x < delta2.y)
                result.offset.y = delta2.y;
            else
                result.offset.x = delta2.x;
            result.offset.x *= -Math.sign(delta.x);
            result.offset.y *= -Math.sign(delta.y);
        }
        return result;
    }
    Collision.testBoxCollision = testBoxCollision;
})(Collision || (Collision = {}));
var KeyState;
(function (KeyState) {
    KeyState[KeyState["Up"] = 0] = "Up";
    KeyState[KeyState["Down"] = 1] = "Down";
    KeyState[KeyState["Pressed"] = 2] = "Pressed";
    KeyState[KeyState["Released"] = -1] = "Released";
})(KeyState || (KeyState = {}));
var Game;
(function (Game) {
    function testMapCollision(center, size) {
        let b = { offset: { x: 0, y: 0 }, found: false };
        if (center.x - size.x / 2 < 0) {
            b.offset.x = (center.x - size.x / 2);
            b.found = true;
            return b;
        }
        if (center.y - size.y / 2 < 0) {
            b.offset.y = (center.y - size.y / 2);
            b.found = true;
            return b;
        }
        if (GFX.tileMap.map) {
            let map = GFX.tileMap.map;
            let mapx = map.sizeInTiles.x * map.tileSize;
            let mapy = map.sizeInTiles.y * map.tileSize;
            if (center.x + size.x / 2 > mapx) {
                b.offset.x = (center.x + size.x / 2) - mapx;
                b.found = true;
                return b;
            }
            if (center.y + size.y / 2 > mapy) {
                b.offset.y = (center.y + size.y / 2) - mapy;
                b.found = true;
                return b;
            }
            let tryMatrix = [];
            tryMatrix.push(Vector2New(0, 0));
            tryMatrix.push(Vector2New(1, 0));
            tryMatrix.push(Vector2New(0, 1));
            tryMatrix.push(Vector2New(-1, 0));
            tryMatrix.push(Vector2New(0, -1));
            tryMatrix.push(Vector2New(1, 1));
            tryMatrix.push(Vector2New(-1, -1));
            tryMatrix.push(Vector2New(1, -1));
            tryMatrix.push(Vector2New(-1, 1));
            let base = { x: Math.floor(center.x / map.tileSize), y: Math.floor(center.y / map.tileSize) };
            for (let i = 0; i < tryMatrix.length; i++) {
                let vs = tryMatrix[i];
                let cm = Vector2Clone(base);
                Vector2Add(cm, vs);
                let ind = map.getTileIndex(cm);
                if (ind == -1 || map.collision[ind]) {
                    Vector2ScalarMul(cm, map.tileSize);
                    cm.x += map.tileSize / 2;
                    cm.y += map.tileSize / 2;
                    let res = Collision.testBoxCollision(center, size, cm, { x: map.tileSize, y: map.tileSize });
                    res.fjhh = vs;
                    res.ffjhh = cm;
                    if (res.found)
                        return res;
                }
            }
        }
        return b;
    }
    Game.testMapCollision = testMapCollision;
    function changeMap(map) {
        Game.nextMap = map;
    }
    Game.changeMap = changeMap;
    function removeActor(act) {
        act.deinit();
        Game.actors.delete(act);
    }
    Game.removeActor = removeActor;
    function addActor(act) {
        act.init();
        Game.actors.add(act);
    }
    Game.addActor = addActor;
    function start() {
        Game.actors = new Set();
        Game.time = 0;
        Game.nextMap = null;
        Game.keyMap = {};
        Game.keyMap[37] = "left";
        Game.keyMap[38] = "up";
        Game.keyMap[39] = "right";
        Game.keyMap[40] = "down";
        Game.keyMap[32] = "activate";
        Game.keyMap[8] = "say";
        Game.keyMap[65] = "left";
        Game.keyMap[87] = "up";
        Game.keyMap[68] = "right";
        Game.keyMap[83] = "down";
        Game.keyMap[16] = "shift";
        Game.keyMap[13] = "enter";
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
        Game.keyStates = {};
        for (var k in Game.keyMap) {
            if (Game.keyMap.hasOwnProperty(k)) {
                Game.keyStates[Game.keyMap[k]] = KeyState.Up;
            }
        }
        window.addEventListener("keydown", function (ev) {
            if (ev.keyCode in Game.keyMap) {
                var v = Game.keyMap[ev.keyCode];
                Game.keyStates[v] = KeyState.Pressed;
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
            if (ev.keyCode in Game.keyMap) {
                var v = Game.keyMap[ev.keyCode];
                Game.keyStates[v] = KeyState.Released;
            }
        }, false);
    }
    Game.start = start;
    function update() {
        if (Game.nextMap) {
            GFX.tileMap.setMap(TileMaps[Game.nextMap]);
            Game.nextMap = null;
        }
        Game.time += 1;
        Game.actors.forEach(function (i) {
            i.update();
        });
        for (var k in Game.keyStates) {
            if (Game.keyStates.hasOwnProperty(k)) {
                let v = Game.keyStates[k];
                if (v == KeyState.Released)
                    Game.keyStates[k] = KeyState.Up;
                if (v == KeyState.Pressed)
                    Game.keyStates[k] = KeyState.Down;
            }
        }
    }
    Game.update = update;
})(Game || (Game = {}));
class PlayerClient {
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
    teleport(pos) {
        this.position = Vector2Clone(pos);
    }
    init() {
        GFX.addDrawable(this.sprite);
        GFX.addDrawable(this.text);
    }
    deinit() {
        GFX.removeDrawable(this.sprite);
        GFX.removeDrawable(this.text);
    }
    showmessage(mes) {
        this.text.text = mes;
        setTimeout(function () { this.text.text = ""; }, 2000);
    }
    update() {
        this.text.position.x = this.position.x;
        this.text.position.y = this.position.y - 30;
    }
}
class InterpolatedPlayerClient extends PlayerClient {
    constructor() {
        super();
        this.lastPosition = Vector2New(0, 0);
    }
    init() {
        GFX.addDrawable(this.sprite);
    }
    deinit() {
        GFX.removeDrawable(this.sprite);
    }
    teleport(pos) {
        this.position = Vector2Clone(pos);
        this.lastPosition = Vector2Clone(pos);
    }
    update() {
        let diff = Vector2Clone(this.position);
        Vector2Sub(diff, this.lastPosition);
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
    constructor() {
        super();
    }
    update() {
        if (!Chat.chatactivated) {
            let vel = Vector2New(0, 0);
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
                console.log(this.position);
                let coll = Game.testMapCollision(this.position, { x: 32, y: 32 });
                if (coll.found) {
                    console.log(coll);
                    this.position.x -= coll.offset.x;
                    this.position.y -= coll.offset.y;
                }
            }
            if (Game.keyStates["activate"] == KeyState.Pressed) {
                this.activated = true;
            }
        }
        if (Game.keyStates["enter"] == KeyState.Pressed) {
            if (Chat.chatactivated) {
                Chat.sendCurrentMessage();
                Chat.chatactivated = false;
            }
            else {
                Chat.clearCurrentMessage();
                Chat.chatactivated = true;
            }
        }
        super.update();
        GFX.centerCameraOn(this.position);
    }
}
TextureImports =
    {
        "font1": { "source": "assets/font1.png", "isPowerOfTwo": false },
        "castle1": { "source": "assets/graphics/castle1.png", "isPowerOfTwo": false },
        "castle": { "source": "assets/graphics/castle.png", "isPowerOfTwo": false },
        "townexit": { "source": "assets/graphics/townexit.png", "isPowerOfTwo": false },
        "citywall": { "source": "assets/graphics/citywall.png", "isPowerOfTwo": false },
        "cottage1": { "source": "assets/graphics/cottage.png", "isPowerOfTwo": false },
        "hat1": { "source": "assets/graphics/tophat.png", "isPowerOfTwo": true },
        "deepwater": { "source": "assets/graphics/deepwater.png", "isPowerOfTwo": true },
        "dirtroad": { "source": "assets/graphics/dirtroad.png", "isPowerOfTwo": true },
        "grass": { "source": "assets/graphics/grass.png", "isPowerOfTwo": true },
        "sand": { "source": "assets/graphics/sand.png", "isPowerOfTwo": true },
        "shallowwater": { "source": "assets/graphics/shallowwater.png", "isPowerOfTwo": true },
        "woodenbridge": { "source": "assets/graphics/woodenbridge.png", "isPowerOfTwo": true }
    };
ShaderImports =
    {
        "basic": {
            "vert": "assets/shaders/basic.vs",
            "frag": "assets/shaders/basic.fs"
        },
        "negative": {
            "vert": "assets/shaders/basic.vs",
            "frag": "assets/shaders/inverted.fs"
        },
        "text": {
            "vert": "assets/shaders/font.vs",
            "frag": "assets/shaders/font.fs"
        },
        "map": {
            "vert": "assets/shaders/map.vs",
            "frag": "assets/shaders/basic.fs"
        },
        "colored": {
            "vert": "assets/shaders/basic.vs",
            "frag": "assets/shaders/colored.fs"
        }
    };
ShaderUniforms =
    {
        "texture": "u_Texture",
        "scale": "u_Scale",
        "renderSize": "u_RenderSize",
        "size": "u_Size",
        "position": "u_Position",
        "depth": "u_Depth",
        "charindex": "u_CharIndex",
        "color": "u_Color"
    };
ShaderAttributes =
    {
        "position": "v_Position",
        "texcoord": "v_TexCoord"
    };
class Texture {
    constructor(name, src, ip2) {
        this.loaded = false;
        this.name = name;
        this.source = src;
        this.isPowerOfTwo = ip2;
        this.size = Vector2New(0, 0);
        this.texture = 0;
    }
    getSourceName() {
        return "Texture " + this.name + " at " + this.source;
    }
    load(callback) {
        this.image = new Image();
        let str = "Loaded image " + this.name + ":" + this.source;
        let imstr = this.name + ":" + this.source;
        let us = this;
        this.image.onerror = function () {
            callback(false);
        };
        this.image.onload = function () {
            us.texture = GFX.gl.createTexture();
            us.loaded = true;
            GFX.gl.bindTexture(GFX.gl.TEXTURE_2D, us.texture);
            GFX.gl.texImage2D(GFX.gl.TEXTURE_2D, 0, GFX.gl.RGBA, GFX.gl.RGBA, GFX.gl.UNSIGNED_BYTE, us.image);
            GFX.gl.texParameteri(GFX.gl.TEXTURE_2D, GFX.gl.TEXTURE_MAG_FILTER, GFX.gl.NEAREST);
            //GFX.gl.generateMipmap(GFX.gl.TEXTURE_2D);
            if (us.isPowerOfTwo) {
                GFX.gl.texParameteri(GFX.gl.TEXTURE_2D, GFX.gl.TEXTURE_MIN_FILTER, GFX.gl.NEAREST_MIPMAP_NEAREST);
                GFX.gl.texParameteri(GFX.gl.TEXTURE_2D, GFX.gl.TEXTURE_WRAP_T, GFX.gl.REPEAT);
                GFX.gl.texParameteri(GFX.gl.TEXTURE_2D, GFX.gl.TEXTURE_WRAP_S, GFX.gl.REPEAT);
                GFX.gl.generateMipmap(GFX.gl.TEXTURE_2D);
            }
            else {
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
class Shader {
    constructor(name, srcv, srcf) {
        this.name = name;
        this.sourceVert = srcv;
        this.sourceFrag = srcf;
    }
    getSourceName() {
        return "Shader " + this.name + " at " + this.sourceFrag + " & " + this.sourceVert;
    }
    load(callback) {
        let us = this;
        let str = "Loaded shader " + this.name + ":" + this.sourceFrag + " & " + this.sourceVert;
        this.vertLoaded = false;
        this.fragLoaded = false;
        this.uniforms = {};
        this.attributes = {};
        function bothLoad() {
            try {
                us.program = GFX.gl.createProgram();
                GFX.gl.attachShader(us.program, us.shaderVert);
                GFX.gl.attachShader(us.program, us.shaderFrag);
                GFX.gl.linkProgram(us.program);
                for (var key in ShaderUniforms) {
                    if (!ShaderUniforms.hasOwnProperty(key))
                        continue;
                    us.uniforms[key] = GFX.gl.getUniformLocation(us.program, ShaderUniforms[key]);
                }
                for (var key in ShaderAttributes) {
                    if (!ShaderAttributes.hasOwnProperty(key))
                        continue;
                    us.attributes[key] = GFX.gl.getAttribLocation(us.program, ShaderAttributes[key]);
                }
                callback(true);
            }
            catch (e) {
                console.log(e);
                callback(false);
            }
        }
        let xht = new XMLHttpRequest();
        xht.open("GET", this.sourceFrag, true);
        xht.overrideMimeType('text/plain');
        xht.onload = function () {
            us.shaderFrag = GFX.gl.createShader(GFX.gl.FRAGMENT_SHADER);
            GFX.gl.shaderSource(us.shaderFrag, this.responseText);
            GFX.gl.compileShader(us.shaderFrag);
            if (!GFX.gl.getShaderParameter(us.shaderFrag, GFX.gl.COMPILE_STATUS)) {
                console.log(GFX.gl.getShaderInfoLog(us.shaderFrag));
            }
            us.fragLoaded = true;
            if (us.vertLoaded)
                bothLoad();
        };
        xht.send();
        xht = new XMLHttpRequest();
        xht.open("GET", this.sourceVert, true);
        xht.overrideMimeType('text/plain');
        xht.onload = function () {
            us.shaderVert = GFX.gl.createShader(GFX.gl.VERTEX_SHADER);
            GFX.gl.shaderSource(us.shaderVert, this.responseText);
            GFX.gl.compileShader(us.shaderVert);
            if (!GFX.gl.getShaderParameter(us.shaderVert, GFX.gl.COMPILE_STATUS)) {
                console.log(GFX.gl.getShaderInfoLog(us.shaderVert));
            }
            us.vertLoaded = true;
            if (us.fragLoaded)
                bothLoad();
        };
        xht.send();
    }
}
class DrawableColorBox {
    constructor() {
        this.visible = true;
        this.depth = 0;
        this.position = Vector2New(0, 0);
        this.size = Vector2New(0, 0);
        this.color = { r: 0, g: 0, b: 0, a: 1.0 };
    }
    draw() {
        let sb = new ShaderBinder();
        sb.useShader(GFX.shaders["colored"]);
        GFX.gl.uniform4f(GFX.currentShader.uniforms["color"], this.color.r, this.color.g, this.color.b, this.color.a ? this.color.a : 1.0);
        GFX.drawCenteredTextureless(this.position, this.depth, this.size);
        sb.restoreShader();
    }
}
class DrawableTextureBox {
    constructor() {
        this.visible = true;
        this.depth = 0;
        this.position = Vector2New(0, 0);
        this.size = Vector2New(0, 0);
        this.texture = null;
    }
    draw() {
        let sb = new ShaderBinder();
        GFX.drawCentered(this.texture, this.position, this.depth, this.size);
    }
}
class DrawableTestParticle extends DrawableColorBox {
    constructor(maxSize) {
        super();
        this.maxSize = maxSize;
        this.timer = 60;
        this.velocity = Vector2New(Math.random() * 2 - 1, Math.random() * 2 - 1);
    }
    draw() {
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
class ShaderBinder {
    useShader(shader) {
        this.lastShader = GFX.currentShader;
        GFX.updateShader(shader);
    }
    restoreShader() {
        if (this.lastShader != null)
            GFX.updateShader(this.lastShader);
    }
}
var GFX;
(function (GFX) {
    function removeDrawable(drw) {
        GFX.drawables.delete(drw);
    }
    GFX.removeDrawable = removeDrawable;
    function addDrawable(drw) {
        GFX.drawables.add(drw);
    }
    GFX.addDrawable = addDrawable;
    function defineDatas() {
        GFX.textures = {};
        GFX.shaders = {};
        let loader = new AsyncLoader();
        //TextureImports & ShaderImports defined in assets.ts
        for (var key in TextureImports) {
            if (!TextureImports.hasOwnProperty(key))
                continue;
            let source = (TextureImports[key].source);
            let ip2 = (TextureImports[key].isPowerOfTwo);
            let texture = new Texture(key, source, ip2);
            GFX.textures[key] = texture;
            loader.addElement(texture);
        }
        for (var key in ShaderImports) {
            if (!ShaderImports.hasOwnProperty(key))
                continue;
            let v = (ShaderImports[key].vert);
            let f = (ShaderImports[key].frag);
            let shader = new Shader(key, v, f);
            GFX.shaders[key] = shader;
            loader.addElement(shader);
        }
        return loader;
    }
    GFX.defineDatas = defineDatas;
    function updateViewport(canvas) {
        GFX.gl.viewport(0, 0, canvas.width, canvas.height);
        GFX.renderSize.x = canvas.width;
        GFX.renderSize.y = canvas.height;
        GFX.scale = Vector2Clone(GFX.renderSize);
    }
    GFX.updateViewport = updateViewport;
    function start(canvas) {
        GFX.drawables = new Set();
        GFX.tileMap = new DrawableTileMap();
        addDrawable(GFX.tileMap);
        //get open gl context
        GFX.gl = canvas.getContext("webgl");
        GFX.quadBuffer = GFX.gl.createBuffer();
        //create a buffer for a unit square
        GFX.gl.bindBuffer(GFX.gl.ARRAY_BUFFER, GFX.quadBuffer);
        let vertices = [
            -1.0, -1.0, 0.0, 0.0,
            1.0, -1.0, 1.0, 0.0,
            -1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 1.0, 1.0
        ];
        GFX.gl.bufferData(GFX.gl.ARRAY_BUFFER, new Float32Array(vertices), GFX.gl.STATIC_DRAW);
        GFX.gl.clearColor(0, 0, 0, 1);
        GFX.gl.disable(GFX.gl.CULL_FACE);
        GFX.gl.enable(GFX.gl.DEPTH_TEST);
        GFX.camera = Vector2New(0, 0);
        GFX.renderSize = Vector2New();
        updateViewport(canvas);
        GFX.currentShader = null;
    }
    GFX.start = start;
    function drawCentered(t, pos, depth = 0.0, size = t.size) {
        GFX.gl.bindTexture(GFX.gl.TEXTURE_2D, t.texture);
        GFX.gl.uniform1f(GFX.currentShader.uniforms["depth"], depth);
        GFX.gl.uniform2f(GFX.currentShader.uniforms["size"], size.x / 2, size.y / 2);
        GFX.gl.uniform2f(GFX.currentShader.uniforms["position"], pos.x - GFX.camera.x, pos.y - GFX.camera.y);
        GFX.gl.drawArrays(GFX.gl.TRIANGLE_STRIP, 0, 4);
    }
    GFX.drawCentered = drawCentered;
    function drawCenteredTextureless(pos, depth = 0.0, size) {
        GFX.gl.uniform1f(GFX.currentShader.uniforms["depth"], depth);
        GFX.gl.uniform2f(GFX.currentShader.uniforms["size"], size.x / 2, size.y / 2);
        GFX.gl.uniform2f(GFX.currentShader.uniforms["position"], pos.x - GFX.camera.x, pos.y - GFX.camera.y);
        GFX.gl.drawArrays(GFX.gl.TRIANGLE_STRIP, 0, 4);
    }
    GFX.drawCenteredTextureless = drawCenteredTextureless;
    function drawCenteredScreenSpaceTextureless(pos, depth = 0.0, size) {
        GFX.gl.uniform1f(GFX.currentShader.uniforms["depth"], depth);
        GFX.gl.uniform2f(GFX.currentShader.uniforms["size"], size.x / 2, size.y / 2);
        GFX.gl.uniform2f(GFX.currentShader.uniforms["position"], pos.x, pos.y);
        GFX.gl.drawArrays(GFX.gl.TRIANGLE_STRIP, 0, 4);
    }
    GFX.drawCenteredScreenSpaceTextureless = drawCenteredScreenSpaceTextureless;
    function updateShader(s) {
        //update shader stuff: uniform, attributes and such
        if (GFX.currentShader != null) {
            let vt = GFX.currentShader.attributes["position"];
            if (vt >= 0)
                GFX.gl.disableVertexAttribArray(vt);
            vt = GFX.currentShader.attributes["texcoord"];
            if (vt >= 0)
                GFX.gl.disableVertexAttribArray(vt);
        }
        GFX.currentShader = s;
        GFX.gl.useProgram(s.program);
        GFX.gl.uniform2f(s.uniforms["scale"], GFX.scale.x / 2, -GFX.scale.y / 2);
        GFX.gl.uniform2f(s.uniforms["renderSize"], GFX.renderSize.x, GFX.renderSize.y);
        GFX.gl.uniform1i(s.uniforms["texture"], 0);
        let vt = GFX.currentShader.attributes["position"];
        if (vt >= 0)
            GFX.gl.enableVertexAttribArray(vt);
        vt = GFX.currentShader.attributes["texcoord"];
        if (vt >= 0)
            GFX.gl.enableVertexAttribArray(vt);
        bindBuffer();
    }
    GFX.updateShader = updateShader;
    function bindBuffer() {
        GFX.gl.bindBuffer(GFX.gl.ARRAY_BUFFER, GFX.quadBuffer);
        bindAttributePointers();
    }
    GFX.bindBuffer = bindBuffer;
    function bindAttributePointers() {
        let vt = GFX.currentShader.attributes["position"];
        if (vt >= 0)
            GFX.gl.vertexAttribPointer(vt, 2, GFX.gl.FLOAT, false, 4 * 4, 0);
        vt = GFX.currentShader.attributes["texcoord"];
        if (vt >= 0)
            GFX.gl.vertexAttribPointer(vt, 2, GFX.gl.FLOAT, false, 4 * 4, 4 * 2);
    }
    GFX.bindAttributePointers = bindAttributePointers;
    function centerCameraOn(pos) {
        GFX.camera.x = pos.x - GFX.renderSize.x / 2;
        GFX.camera.y = pos.y - GFX.renderSize.y / 2;
    }
    GFX.centerCameraOn = centerCameraOn;
    function update() {
        let curmap = GFX.tileMap.map;
        if (curmap) {
            let lowerLeft = Vector2Clone(GFX.camera);
            Vector2Add(lowerLeft, GFX.renderSize);
            let mapsize = Vector2Clone(curmap.sizeInTiles);
            Vector2ScalarMul(mapsize, curmap.tileSize);
            if (lowerLeft.x > mapsize.x)
                GFX.camera.x -= (lowerLeft.x - mapsize.x);
            if (lowerLeft.y > mapsize.y)
                GFX.camera.y -= (lowerLeft.y - mapsize.y);
            if (GFX.camera.x < 0)
                GFX.camera.x = 0;
            if (GFX.camera.y < 0)
                GFX.camera.y = 0;
        }
        //draw all gfx stuff
        //bind the "basic" shader
        updateShader(GFX.shaders["basic"]);
        GFX.gl.clear(GFX.gl.COLOR_BUFFER_BIT | GFX.gl.DEPTH_BUFFER_BIT);
        //and draw
        GFX.drawables.forEach(function (i) {
            if (i.visible)
                i.draw();
        });
    }
    GFX.update = update;
})(GFX || (GFX = {}));
class DrawableText {
    constructor() {
        this.visible = true;
        this.screenSpace = false;
        this.text = "";
        this.depth = 0;
        this.characterScale = 1;
        this.position = Vector2New(0, 0);
        this.color = { r: 1, g: 1, b: 1, a: 1.0 };
    }
    setTexture(tex) {
        this.texture = tex;
    }
    draw() {
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
        for (let i = 0; i < this.text.length; i++) {
            if (this.text.charAt(i) == "\n") {
                linePos.y += scaledSize.y;
                a = Vector2Clone(linePos);
                continue;
            }
            GFX.gl.uniform1f(GFX.currentShader.uniforms["charindex"], this.text.charCodeAt(i) - 32);
            if (this.screenSpace)
                GFX.drawCenteredScreenSpaceTextureless(a, this.depth, scaledSize);
            else
                GFX.drawCenteredTextureless(a, this.depth, scaledSize);
            a.x += scaledSize.x;
        }
        sb.restoreShader();
    }
}
TileMaps = {};
TileMapImports = {};
TileMapImports["Overworld"] = "assets/overworld.json";
TileMapImports["Town"] = "assets/smalltown.json";
class TileMap {
    constructor(name, src) {
        this.tileSize = 64;
        this.sizeInTiles = Vector2New(0, 0);
        this.name = name;
        this.source = src;
        this.tileDefs = {};
        this.objects = [];
    }
    getSourceName() {
        return "Tilemap " + this.name + " at " + this.source;
    }
    getTileIndex(p) {
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
    load(callback) {
        let us = this;
        let doTM = function (tm) {
            let name = tm.name;
            //only consider tilemaps with names
            //beginning with "terrain" 
            //TODO: properly handle object tilemaps
            if (name.slice(0, 7) != "terrain")
                return;
            let firstGid = tm.firstgid;
            for (let key in tm.tiles) {
                if (!tm.tiles.hasOwnProperty(key))
                    continue;
                let num = parseInt(key) + firstGid;
                let img = tm.tiles[key].image;
                img = img.slice(0, img.indexOf('.'));
                let tex = GFX.textures[img];
                us.tileDefs[num] = { texture: tex };
            }
        };
        let xht = new XMLHttpRequest();
        xht.open("GET", this.source, true);
        xht.overrideMimeType('text/plain');
        xht.onload = function () {
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
                    if (lay.type != "tilelayer")
                        continue;
                    if (lay.name == "terrain") {
                        us.tiles = lay.data;
                    }
                    else if (lay.name == "collision") {
                        for (let i = 0; i < us.collision.length; i++)
                            us.collision[i] = (lay.data[i] > 0);
                    }
                }
                callback(true);
            }
            catch (e) {
                console.log(e);
                callback(false);
            }
        };
        xht.onerror = function () {
            callback(false);
        };
        xht.send();
    }
}
class DrawableTileMap {
    constructor() {
        this.visible = true;
        this.map = null;
        this.buffers = [];
    }
    setMap(map) {
        this.map = map;
        //clear the previous buffers
        for (var i = this.buffers.length - 1; i >= 0; i--) {
            GFX.gl.deleteBuffer(this.buffers[i].buffer);
        }
        this.buffers = [];
        if (!map)
            return;
        let determOff = function (x, y, scale, depth) {
            depth = (depth >= 0) ? depth : 4;
            let v = Vector2New((123456 + Math.sin((x * 433113.11 + 15733) + (y * 114.11 + 234)) * 123456) % 1, (123456 + Math.sin((x * 9143.89 + 77.33) + (y * 87150.31 + 0.435)) * 123456) % 1);
            v.x *= scale;
            v.x -= scale / 2;
            v.y *= scale;
            v.y -= scale / 2;
            if (depth > 1)
                return determOff(v.y, v.x, scale, depth - 1);
            return v;
        };
        //vertex arrays
        let tiles = {};
        let x = 0;
        let y = 0;
        for (var i = map.tiles.length - 1; i >= 0; i--) {
            x = i % map.sizeInTiles.x;
            y = Math.floor(i / map.sizeInTiles.x);
            let gid = map.tiles[i];
            let type = map.tileDefs[gid];
            if (!type)
                continue;
            if (!(gid in tiles)) {
                tiles[gid] = [];
            }
            //How wonky you want your tilemaps?
            let wonkiness = 16;
            let p1 = determOff(x, y, wonkiness);
            let p2 = determOff(x + 1, y, wonkiness);
            let p3 = determOff(x, y + 1, wonkiness);
            let p4 = determOff(x + 1, y + 1, wonkiness);
            let base = Vector2New(x, y);
            let ts = map.tileSize; //tile size
            Vector2ScalarMul(base, ts);
            //two triangles
            tiles[gid].push(base.x + p1.x, base.y + p1.x, 0, 0);
            tiles[gid].push(base.x + ts + p2.x, base.y + p2.x, 1.0, 0);
            tiles[gid].push(base.x + p3.x, base.y + ts + p3.x, 0, 1.0);
            tiles[gid].push(base.x + p3.x, base.y + ts + p3.x, 0, 1.0);
            tiles[gid].push(base.x + ts + p2.x, base.y + p2.x, 1.0, 0);
            tiles[gid].push(base.x + ts + p4.x, base.y + ts + p4.x, 1.0, 1.0);
        }
        for (let gid in tiles) {
            if (!tiles.hasOwnProperty(gid))
                continue;
            let arr = tiles[gid];
            let buf = { buffer: null, texture: map.tileDefs[gid].texture, count: arr.length / 4 };
            buf.buffer = GFX.gl.createBuffer();
            GFX.gl.bindBuffer(GFX.gl.ARRAY_BUFFER, buf.buffer);
            GFX.gl.bufferData(GFX.gl.ARRAY_BUFFER, new Float32Array(arr), GFX.gl.STATIC_DRAW);
            this.buffers.push(buf);
        }
    }
    draw() {
        let sb = new ShaderBinder();
        sb.useShader(GFX.shaders["map"]);
        let gl = GFX.gl;
        for (let i = 0; i < this.buffers.length; i++) {
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
function initMain(loadedCallback) {
    let canvas = document.getElementById("canvas");
    Game.start();
    //initialize the opengl stuff
    GFX.start(canvas);
    //get all the data defs
    let asyncData = GFX.defineDatas();
    //add tilemap data defs
    for (let key in TileMapImports) {
        if (!TileMapImports.hasOwnProperty(key))
            continue;
        TileMaps[key] = new TileMap(key, TileMapImports[key]);
        asyncData.addElement(TileMaps[key]);
    }
    //and load them, asynchronously
    asyncData.startLoad();
    //on window resize function
    function windowResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        GFX.updateViewport(canvas);
        if (Chat.initialized) {
            Chat.windowResize();
        }
    }
    window.addEventListener("resize", windowResize, false);
    windowResize();
    function loop() {
        Game.update();
        GFX.update();
    }
    function isLoaded() {
        //if all the asyncdata is loaded
        if (asyncData.isDone()) {
            loadedCallback();
            //call loop every 17 milliseconds
            setInterval(loop, 17);
            return;
        }
        setTimeout(isLoaded, 50);
    }
    isLoaded();
}
function Vector2New(x = 0, y = 0) {
    return { x: x, y: y };
}
function Vector2FromAngle(ang, len = 1) {
    return Vector2New(Math.cos(ang * Math.PI / 180) * len, -Math.sin(ang * Math.PI / 180) * len);
}
function Vector2Clone(self) {
    return Vector2New(self.x, self.y);
}
function Vector2ScalarMul(self, s) {
    self.x *= s;
    self.y *= s;
}
function Vector2ScalarDiv(self, s) {
    self.x /= s;
    self.y /= s;
}
function Vector2Add(self, o) {
    self.x += o.x;
    self.y += o.y;
}
function Vector2Sub(self, o) {
    self.x -= o.x;
    self.y -= o.y;
}
function Vector2GetAngle(self) {
    return Math.atan2(-self.y, self.x) * 180.0 / Math.PI;
}
function Vector2Length(self) {
    return Math.sqrt(self.x * self.x + self.y * self.y);
}
function Vector2Normalize(self) {
    let l = Vector2Length(self);
    if (l == 0) {
        self.x = 1;
        self.y = 0;
        return;
    }
    Vector2ScalarDiv(self, l);
}
function Vector2Dot(self, o) {
    return self.x * o.x + self.y * o.y;
}
//# sourceMappingURL=TSClient.js.map