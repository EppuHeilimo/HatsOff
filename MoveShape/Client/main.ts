

function initMain(loadedCallback : () => void)
{
	let canvas = <HTMLCanvasElement> document.getElementById("canvas");

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
	function windowResize()
	{
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		GFX.updateViewport(canvas);		
    }

	window.addEventListener("resize", windowResize, false);
	windowResize();

	function loop()
    {
        Game.update();
		GFX.update();
	}

	function isLoaded()
    {
        //if all the asyncdata is loaded
		if (asyncData.isDone())
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