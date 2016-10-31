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
TextureImports =
    {
        "font1": { "source": "assets/font1.png", "isPowerOfTwo": false },
        "castle1": { "source": "assets/graphics/castle1.png", "isPowerOfTwo": false },
        "cottage1": { "source": "assets/graphics/cottage.png", "isPowerOfTwo": false },
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
        let vt = GFX.currentShader.attributes["position"];
        if (vt >= 0)
            GFX.gl.vertexAttribPointer(vt, 2, GFX.gl.FLOAT, false, 4 * 4, 0);
        vt = GFX.currentShader.attributes["texcoord"];
        if (vt >= 0)
            GFX.gl.vertexAttribPointer(vt, 2, GFX.gl.FLOAT, false, 4 * 4, 4 * 2);
    }
    GFX.bindBuffer = bindBuffer;
    function update() {
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
function initMain() {
    let canvas = document.getElementById("canvas");
    //initialize the opengl stuff
    GFX.start(canvas);
    //get all the data defs
    let asyncData = GFX.defineDatas();
    //and load them, asynchronously
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
        GFX.update();
    }
    function isLoaded() {
        //if all the asyncdata is loaded
        if (asyncData.isDone()) {
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