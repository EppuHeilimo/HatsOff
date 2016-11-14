declare var connectionIsEstablished: boolean;
connectionIsEstablished = false;

function initMain(loadedCallback : () => void)
{
    let canvas = <HTMLCanvasElement>document.getElementById("canvas");
    
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
        if (Chat.initialized)
        {
            Chat.windowResize();
        }
    }

	window.addEventListener("resize", windowResize, false);
	windowResize();

	function loop()
    {
        Chat.loop();
        Game.update();
		GFX.update();
	}

	function isLoaded()
    {
        //if all the asyncdata is loaded
        if (asyncData.isDone() && connectionIsEstablished)
        {
        	loadedCallback();
            //call loop every 17 milliseconds
			setInterval(loop,17);
			return;
		}

		setTimeout(isLoaded,50);
    }

	isLoaded();

    
}