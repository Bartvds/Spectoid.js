define(function(){
	
	var Aspect = function(all)
	{
		this._have = [];
		this._not = [];
		this._uses = [];
		this._filter = null;
		this._recompile = true;
		this._changed = false;
		this._values = false;
		this._all = all;
		this._world = null;
	};
	Aspect.prototype.have = function()
	{
		for (var i = 0; i<arguments.length; i++)
		{
			var type = arguments[i];
			if (!type) throw Error('null or empty type');
			//console.log(['have', type.id, type.type]);
			if (this._have.indexOf(type) < 0)
			{
				this._have.push(type);
				this._changed = true;
				this._values = true;
				this._recompile = true;
			}
		}
		return this;
	};
	Aspect.prototype.not = function()
	{
		for (var i = 0; i<arguments.length; i++)
		{
			var type = arguments[i];
			//console.log(['not', type.id, type.type]);
			if (!type) throw Error('null or empty type');
			if (this._not.indexOf(type) < 0)
			{
				this._not.push(type);
				this._changed = true;
				this._values = true;
				this._recompile = true;
			}
		}
		return this;
	};
	Aspect.prototype.uses = function(comp)
	{
		//console.log(['Aspect.uses', comp, comp.type]);
		//if (!comp) throw new Error('null comp');
		//if (!comp.type) throw new Error('null comp.type');
		if (this._recompile)
		{
			if (!this.compile()) return false;
		}
		return this._uses.indexOf(comp.type) > -1;
	};
	Aspect.prototype.compile = function()
	{
		//console.log(['Aspect.compile']);
		var i;
		var ind;
		this._filter = [];
		this._uses = [];
		this._recompile = false;
		
		for (i = 0; i < this._have.length;i++)
		{
			ind = this._world.getComponentIndex(this._have[i]);
			if (ind < 0)
			{
				//console.log(['cannot resolve '+this._have[i].type]);
				this._recompile = true;
				return false;
			}
			//console.log(['have ', this._have[i].type, ind]);
			this._filter.push(ind, 1);
			this._uses.push(this._have[i].type);
		}
		for (i = 0; i < this._not.length;i++)
		{
			ind = this._world.getComponentIndex(this._not[i]);
			if (ind < 0)
			{
				//console.log(['cannot resolve '+this._not[i].type]);
				this._recompile = true;
				return false;
			}
			//console.log(['not ', this._not[i].type, ind]);
			this._filter.push(ind, -1);	
			this._uses.push(this._have[i].type);
		}
		return true;
	};
	Aspect.prototype.acceptEntity = function(e)
	{
		var i, j;
		var mask;
		var ind;
		if (this._recompile)
		{
			this.compile();
		}
		if (this._recompile)
		{
			//nothing to do
			console.log(['Aspect.acceptEntity cannot compile']);
			return;
		}

		//for (i = this._filter.length-2; i>= 0;i-=2)
		for (i = 0; i < this._filter.length;i++)
		{
			ind = this._filter[i];
			mask = this._filter[i + 1];
			if(mask > 0)
			{
				if (!e._components[ind])
				{
					//console.log(['skip on missing ', e._components[ind]]);
					return false;
				}
			}
			else if (mask < 0)
			{
				if (e._components[ind])
				{
					//console.log(['skip on got ', e._components[ind]]);
					return false;
				}
			}
		}
		//
		return this._values || (this._all && !this._values);
	};
	Aspect.prototype.filterEntities = function(_entities)
	{
		var res = [];
		for (var i = entities.length-1; i>= 0; i--)
		{
			if (this.acceptEntity(entities[i]))
			{
				//got a keeper
				res.push(entities[i]);
			}
		}
		return res;
	};
	
	return {
		Aspect:Aspect
	};
});