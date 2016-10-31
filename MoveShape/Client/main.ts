

function initMain()
{
	let canvas = <HTMLCanvasElement> document.getElementById("canvas");

    //initialize the opengl stuff
	GFX.start(canvas);

    //get all the data defs
    let asyncData = GFX.defineDatas();
    //and load them, asynchronously
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
		GFX.update();
	}

	function isLoaded()
    {
        //if all the asyncdata is loaded
		if (asyncData.isDone())
        {
            //call loop every 17 milliseconds
			setInterval(loop,17);
			return;
		}

		setTimeout(isLoaded,50);
    }

	isLoaded();

}