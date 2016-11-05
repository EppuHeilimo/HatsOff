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
            let loadCallBack = function () {
                us.finishLoad(true);
            };
            setTimeout(function (target, callBack) {
                target.load(callBack);
            }, 0, this.targets[i], loadCallBack);
        }
    }
    isDone() {
        if (this.loaded >= this.targets.length)
            return true;
        return false;
    }
}
var KeyState;
(function (KeyState) {
    KeyState[KeyState["Up"] = 0] = "Up";
    KeyState[KeyState["Down"] = 1] = "Down";
    KeyState[KeyState["Pressed"] = 2] = "Pressed";
    KeyState[KeyState["Released"] = -1] = "Released";
})(KeyState || (KeyState = {}));
var Game;
(function (Game) {
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
        Game.keyMap = {};
        Game.keyMap[37] = "left";
        Game.keyMap[38] = "up";
        Game.keyMap[39] = "right";
        Game.keyMap[40] = "down";
        Game.keyMap[32] = "activate";
        Game.keyMap[65] = "left";
        Game.keyMap[87] = "up";
        Game.keyMap[68] = "right";
        Game.keyMap[83] = "down";
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
        this.sprite.depth = -1;
    }
    teleport(pos) {
        this.position = Vector2Clone(pos);
    }
    init() {
        GFX.addDrawable(this.sprite);
    }
    deinit() {
        GFX.removeDrawable(this.sprite);
    }
    update() {
        this.sprite.position = this.position;
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
    }
}
class LocalPlayerClient extends PlayerClient {
    constructor() {
        super();
    }
    update() {
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
        if (Game.keyStates["activate"] == KeyState.Pressed) {
            this.activated = true;
        }
        GFX.centerCameraOn(this.position);
    }
}
TextureImports =
    {
        "font1": { "source": "assets/font1.png", "isPowerOfTwo": false },
        "castle1": { "source": "assets/graphics/castle1.png", "isPowerOfTwo": false },
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
            "frag": "assets/shaders/basic.fs"
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
    load(callback) {
        this.image = new Image();
        let str = "Loaded image " + this.name + ":" + this.source;
        let imstr = this.name + ":" + this.source;
        let us = this;
        this.image.onerror = function () {
            console.log("Failed to load image ", imstr);
            callback(true);
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
    load(callback) {
        let us = this;
        let str = "Loaded shader " + this.name + ":" + this.sourceFrag + " & " + this.sourceVert;
        this.vertLoaded = false;
        this.fragLoaded = false;
        this.uniforms = {};
        this.attributes = {};
        function bothLoad() {
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
        this.screenSpace = true;
        this.text = "";
        this.depth = 0;
        this.characterScale = 1;
        this.position = Vector2New(0, 0);
    }
    setTexture(tex) {
        this.texture = tex;
    }
    draw() {
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
class TileMap {
    constructor(name, src) {
        this.tileSize = 64;
        this.sizeInTiles = Vector2New(0, 0);
        this.name = name;
        this.source = src;
        this.tileDefs = {};
        this.objects = [];
    }
    load(callback) {
        let us = this;
        let doTM = function (tm) {
            let name = tm.name;
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
            let jsondata = JSON.parse(this.responseText);
            us.sizeInTiles.x = jsondata.width;
            us.sizeInTiles.y = jsondata.height;
            for (let i = 0; i < jsondata.tilesets.length; i++) {
                doTM(jsondata.tilesets[i]);
            }
            for (let i = 0; i < jsondata.layers.length; i++) {
                let lay = jsondata.layers[i];
                if (lay.type != "tilelayer")
                    continue;
                us.tiles = lay.data;
            }
            callback(true);
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
        for (var i = this.buffers.length - 1; i >= 0; i--) {
            GFX.gl.deleteBuffer(this.buffers[i].buffer);
        }
        this.buffers = [];
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
            let base = Vector2New(x, y);
            let ts = map.tileSize; //tile size
            Vector2ScalarMul(base, ts);
            tiles[gid].push(base.x, base.y, 0, 0);
            tiles[gid].push(base.x + ts, base.y, 1.0, 0);
            tiles[gid].push(base.x, base.y + ts, 0, 1.0);
            tiles[gid].push(base.x, base.y + ts, 0, 1.0);
            tiles[gid].push(base.x + ts, base.y, 1.0, 0);
            tiles[gid].push(base.x + ts, base.y + ts, 1.0, 1.0);
        }
        for (let gid in tiles) {
            if (!tiles.hasOwnProperty(gid))
                continue;
            let arr = tiles[gid];
            let buf = { buffer: null, texture: map.tileDefs[gid].texture, count: arr.length / 4 };
            buf.buffer = GFX.gl.createBuffer();
            console.log(arr.length, arr.length / 4, arr.length / (4 * 6));
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
    //and load them, asynchronously
    TileMaps["Overworld"] = new TileMap("Overworld", "assets/map.json");
    asyncData.addElement(TileMaps["Overworld"]);
    asyncData.startLoad();
    //on window resize function
    function windowResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        GFX.updateViewport(canvas);
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