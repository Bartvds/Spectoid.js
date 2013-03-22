define(function()
{
	var types = {};
	var expose;
	
	//make main value
	var type = expose = function(type, expose)
	{
		if (type in types)
		{
			return types[type];
		}
		var def = new DefType(type);		
		types[type] = def;
		
		if (expose)
		{
			var short = type.match(/[\w-]+$/);
			short = short.length > 0 ? short[short.length-1] : type
			expose[short] = def;
		}
		return def;
	};
	var compile = expose.compile = function()
	{
		for (var type in types)
		{
			var def = types[type];
			if(!def.compiled) def.compile();
			if(!def.compiled) throw new Error('error compiling type ' + type);
		}
	};
	
	var Def = function(type)
	{
		this.type = type;
		this.constr = null;
		this.props = null;
		this.extend = null;
		this.members = null;
		this.bind = null;
		
		this.chain = null;
		this.proto = null;
	};
	
	var DefType = function(type)
	{
		console.log(['DefType', type]);
		this.type = type;
		this.def = new Def(type);
		this.compiled = false;
	};
	
	DefType.prototype.extend = function(args)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		if (!this.def.extend) this.def.extend = [];
		for (var i = 0, ii = arguments.length; i < ii; i++)
		{
			var extend = arguments[i];
			if (typeof extend == 'string')
			{
				this.def.extend.push(arguments[i]);
			}
			else
			{
				for (var j = 0, jj = extend.length; j < jj; j++)
				{
					this.def.extend.push(extend[j]);
				}
			}
		}
		return this;
	};
	DefType.prototype.constr = function(constr)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		this.def.constr = constr;
		return this;
	};
	DefType.prototype.init = function(init)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		this.def.init = init;
		return this;
	};
	DefType.prototype.prop = function(props)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		if (!this.def.props) this.def.props = {};
		for (var name in props)
		{
			this.def.props[name] = props[name];
		}
		return this;
	};
	DefType.prototype.member = function(members)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		if (!this.def.members) this.def.members = {};
		for (var name in members)
		{
			this.def.members[name] = members[name];
		}
		return this;
	};
	DefType.prototype.bound = function(methods)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		if (!this.def.bind) this.def.bind = {};
		for (var name in methods)
		{
			this.def.bind[name] = methods[name];
		}
		return this;
	};
	DefType.prototype.create = function()
	{
		if (this.compiled || this.compile())
		{
			return new this.def.proto(arguments);
		}
		return null;
	};
	DefType.prototype.compile = function()
	{
		if (this.compiled) throw new Error('type compiled, cannot recompile ' + this.type);
		console.log(['Def.compile', this.def.type, this]);
		this.compiled = false;
		this.def.proto = null;
		this.def.chain = appendChain(this.def, [this.def]);
		
		//closure
		var that = this;
		var constructors = [];
		var props = [];
		var bind = [];
		var init = this.def.init;
		
		this.def.proto = function (args)
		{
			//comments for {{type}}
			
			var type;
			//# echo type = #type#;
			 
			//# if props or constructors or bind
			var i;
			//# 	if constructors or bind
			var ii;
			//# 	end
			//# end
			
			//# if props
			for (i in props)
			{
				this[i] = props[i];
			}
			//# end
			//# if constructors
			for (i = 0, ii = constructors.length; i < ii; i++)
			{
				constructors[i].call(this);
			}
			//# end
			//# if bind
			for (i = 0, ii = bind.length; i < ii; i++)
			{
				this[bind[i]] = bindTo(this[bind[i]], this);
			}
			//# end
			//# if init
			if(init) 
			{
				if (arguments.length > 1)
				{
					args = arguments;
				}
				init.apply(this, args);
			}
			//# end
		};
		
		var scope = {};
		scope.constructors = constructors;
		scope.props = props;
		scope.bind = bind;
		scope.init = init;
		scope.bindTo = bindTo;
		
		var macroTypes = {};
		//var trimSplitEx = /[\s]*[\n\r]+[\s]*/g
		var trimSplitEx = /[\n\r]+/g
		var directiveEx = /^[ \t]*\/\/#[ \t]*([\w-]+)[ \t]*([\S \t]*)$/g
		
		var macro = function(func, scope)
		{
			var lines = ('('+func.toString()+')').split(trimSplitEx);
			
			var body = [];
			
			for (var i = 0, ii = lines.length; i < ii; i++)
			{
				var line = lines[i];
				var match = directiveEx.exec(line);
				if (match)
				{
					//console.log([match]);
					var op = null, params = null;
					if (match.length > 1)
					{
						op = match[1];
						if (match.length > 2)
						{
							params = match[2];
						}
						console.log([op, params]);
						
						
						continue;
					}
					else
					{
						//compile.append(line);
					}
				}
				body.push(line);
			}
			
			console.log(lines);
			
			
			var closure;
			//yieayaah! with + eval
			with(scope)
			{
				closure = eval(body.join('\n'));
			}
			return closure;
		};
		this.def.proto = macro(this.def.proto, scope);
		
		console.log(this.def.proto.toString());
		
		var sup;
		addDefParts(this.def, this.def.proto, props, bind);
		for (i = 0, ii = this.def.chain.length; i < ii; i++)
		{
			sup = this.def.chain[i];
			if (sup.constr)
			{
				constructors.push(sup.constr);
			}
			addDefParts(sup, this.def.proto, props, bind);
		};
		this.compiled = true;
		console.log(['Def.compile done', this.def.type, this]);
		return this.compiled;
	};
	
	var Stack = function()
	{
		
	};
	//loose utils
	var addDefParts = function(def, to, props, bind)
	{
		var i, name;
		if (def.props)
		{
			for (name in def.props)
			{
				props[name] = def.props[name];
			}
		}
		if (def.bind)
		{
			for (name in def.bind)
			{
				if (typeof def.bind[name] !== 'function') throw new Error('cannot bind a non-function ' + def.type + ' ' + name + ' ' + this.type);
					
				if (bind.indexOf(name) < 0) bind.push(name);
				//put on prototype
				to.prototype[name] = def.bind[name];
			}
		}
		if (def.members)
		{
			for (name in def.members)
			{
				to.prototype[name] = def.members[name];
			}
		}
	};
	var appendChain = function(def, chain)
	{
		//console.log(['appendChain', def.type, def]);
		chain = chain || [];
		
		if (def.extend)
		{
			def.extend.forEach(function(sup, i)
			{
				//console.log(['appendChain', sup, i]);
				if (typeof sup == 'string')
				{
					if (sup in types)
					{
						sup = types[sup].def;
					}
					else
					{
						throw new Error('undefined required type ' + sup + ' for ' + def.type);
					}
				}
				if (chain.indexOf(sup) < 0)
				{
					chain.unshift(sup);
					if (sup.extend && sup.extend.length > 0)
					{
						appendChain(sup, chain);
					}
				}
				else
				{
					//console.log(['appendChain', 'recursion blocked on', def, sup]);
				}
			});
		}
		return chain;
	};
	var bindTo = function(func, scope)
	{
		return function()
		{
			return func.apply(scope, arguments);
		};
	};
	var optimize = function(func, vars)
	{
		var src = func.toString();
		
	};
	
	return expose;
});