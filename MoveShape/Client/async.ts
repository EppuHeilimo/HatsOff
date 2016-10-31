interface AsyncLoadable
{
	load(callback : (success: boolean) => void) : void;
}

class AsyncLoader
{
	constructor()
	{
		this.loading = false;
		this.loaded = 0;
		this.targets = [];
	}
	private loading: boolean;
	private loaded: number;
	private targets: AsyncLoadable[];

	public getProgress(): number
	{
		if (!this.loading)
			return 0.0;
		else
		{
			if (this.targets.length == 0)
				return 1.0;
			return this.loaded / this.targets.length;
		}
	}

	private finishLoad(success: boolean) : void
	{
		this.loaded++;
		//gameLog(this.getProgress()*100,"% done");
	}

	public addElement(asl : AsyncLoadable) : void
	{
		if (this.loading)
			throw "Cannot add elements when load is already initiated";
		this.targets.push(asl);
	}

	public startLoad(): void
	{
		this.loading = true;

		for (let i = 0; i < this.targets.length; i++)
		{
			var us = this;
			let loadCallBack = function()
			{
				us.finishLoad(true);
			};
			
			setTimeout(
				function (target : AsyncLoadable, callBack: (success: boolean) => void)
				{
					target.load(callBack);
				}, 0, this.targets[i], loadCallBack);
		}
	}

	public isDone(): boolean
	{
		if (this.loaded >= this.targets.length)
			return true;
		return false;
	}
}