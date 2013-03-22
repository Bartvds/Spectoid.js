define(function ()
{
	/*

		ditched attempt at js macro's to recompile functions

	 	why? parsing per-line or using comments or string directives doesn't work because minfiers's will strip them out

	 	could work with proper javascript parser?
	*/

	var expose = {};

	var directiveTypes = {};
	//var trimSplitEx = /[\s]*[\r\n]+[\s]*/g
	var splitEx = /[\r\n]+/gm
	//var directiveEx = /^[ \t]*"\#[ \t]*([\w-]+)[ \t]*(.*)";[\n\r]*$/gim
	var directiveEx = /^[ \t]*"\#[ \t]*([\w-]+)[ \t]*([\S \t]*)";[ \t]*$/gim

	var orEx = /[ \t]+or[ \t]+/gi;

	var macro = expose = function (func, scope)
	{
		var lines = ('(' + func.toString() + ')').split(splitEx);

		var accumulator;
		console.log(['macro', {lines: lines}]);
		var tokens = [];
		var i, ii;
		for (i = 0, ii = lines.length; i < ii; i++)
		{
			var line = lines[i];
			//weird reset
			directiveEx.lastIndex = 0;
			var match = directiveEx.exec(line);
			if (match)
			{
				//console.log(['match', match, line]);
				var op = null, params = null;
				if (match.length > 1)
				{
					op = match[1];
					if (match.length > 2 && match[2].length > 0)
					{
						params = match[2];
					}
					console.log(['op', op, params]);
					var token = new (getToken(op))(params);
					token.op = op;
					token.i = i;
					console.log([token]);
					tokens.push(token);
				}
				accumulator = null;
			}
			else if (line)
			{
				console.log(['line', line]);
				if (accumulator) accumulator.lines.push(line);
				else
				{
					accumulator = new Line(line);
					accumulator.i = i;
					tokens.push(accumulator);
				}
			}
		}
		console.log(['tokens', {tokens: tokens}]);

		var token;
		var root = new Block();
		var current = root;
		var stack = [current];
		for (i = 0, ii = tokens.length; i < ii; i++)
		{
			console.log([i, stack.length, (current == root), (current == stack[0]), (root == stack[0])]);

			token = tokens[i];

			current = current.consume(token, stack);

			if (!current) throw new Error('no next step');
		}
		if(stack.length !== 1)
		{
			console.log(['stack', {stack:stack}]);
			throw new Error('stack not cleared, remaining '+stack.length);
		}
		//if(current != root)
		if(stack[0] != root)
		{
			console.log(['current', current]);
			console.log([(current == root), (current == stack[0]), (root == stack[0])]);
			throw new Error('stack not cleared to root');
		}

		console.log(['block', {root: root}]);

		var output = [];
		root.emit(scope, output);

		console.log(['output', {output:output}]);

		var src;
		src = '(' + output.join('\n') + ')';
		//src = '(' + func.toString() + ')';
		console.log(['src', {src:src, func:func}]);
		with (scope)
		{
			func = eval(src);
		}
		return func;
	};

	var Token = function Token()
	{

	};
	Token.prototype.type = 'Token';
	Token.prototype.block = false;
	Token.prototype.skip = false;
	Token.prototype.emit = function(scope, output)
	{

	};

	var Block = function Block(end)
	{
		this.end = end || [];
		this.content = [];
	};
	Block.prototype = Object.create(Token.prototype);
	Block.prototype.type = 'Block';
	Block.prototype.block = true;
	Block.emit = function(array, scope, output)
	{
		for(var i = 0, ii = array.length; i < ii; i++)
		{
			array[i].emit(scope, output);
		}
	};
	Block.prototype.emit = function(scope, output)
	{
		Block.emit(this.content, scope, output);
	};
	Block.prototype.consume = function(token, stack)
	{
		this.content.push(token);

		return this;
	};
	Block.prototype.setChild = function(params)
	{

	};

	var Line = function Line(line)
	{
		this.lines = [line];
	};
	Line.prototype = Object.create(Token.prototype);
	Line.prototype.type = 'Line';
	Line.prototype.emit = function(scope, output)
	{
		for(var i = 0, ii = this.lines.length; i < ii; i++)
		{
			output.push(this.lines[i]);
		}
	};

	var Echo = function Echo(line)
	{
		this.line = line;
	};
	Echo.prototype = Object.create(Token.prototype);
	Echo.prototype.type = 'Echo';
	Echo.prototype.emit = function(scope, output)
	{
		output.push('//echo '+ this.line);
	};

	var If = function If(clause)
	{
		var that = this;
		Block.call(this, ['end-if']);
		//['else-if', 'else', 'end-if'
		this.clause = new Clause(clause);
		this.chain = [];
		this.else = null;
		this.setChild({
			'else-if': function(token)
			{
				that.chain.push(token);
				return token;
			},
			'else': function(token)
			{
				that.else = token;
				return token;
			},
			'end-if': function(token)
			{
				return token;
			}
		});
	};
	If.prototype = Object.create(Block.prototype);
	If.prototype.type = 'If';
	If.prototype.emit = function(scope, output)
	{
		if (this.clause.evaluate(scope))
		{
			Block.emit(this.content, scope, output);
			return;
		}
		for (var i = 0, ii = this.chain.length; i < ii; i++)
		{
			if (this.chain[i].evaluate(scope))
			{
				Block.emit(this.chain[i].content, scope, output);
				return;
			}
		}
		if (this.else && this.else.evaluate(scope))
		{
			Block.emit(this.else.content, scope, output);
			return;
		}
	};

	var Else = function Else()
	{
		Block.call(this, ['end-if']);
	};
	Else.prototype = Object.create(Block.prototype);
	Else.prototype.type = 'Else';

	var Comment = function Comment(text)
	{
		this.text = text;
	};
	Comment.prototype = Object.create(Token.prototype);
	Comment.prototype.type = 'Comment';
	Comment.prototype.emit = function(scope, output)
	{
		output.push('//comment '+this.text);
	};
	var End = function End()
	{

	};
	End.prototype = Object.create(Token.prototype);
	End.prototype.type = 'End';
	End.prototype.skip = true;

	var types = {};
	var addToken = function (id, constr)
	{
		types[id] = constr;
	};
	var getToken = function (id)
	{
		if (id in types) return types[id];
		//throw new Error('getToken no token id ' + id);
		return Line;
	};
	addToken('if', If);
	addToken('else-if', If);
	addToken('else', Else);
	addToken('end-if', End);
	addToken('echo', Echo);

	var Clause = function (clause)
	{
		if (!clause) throw new Error('null clause');
		this.clause = clause.split(orEx);
		if (this.clause.length == 0) throw new Error('zero clause');

		console.log(['Clause', this.clause]);
	};
	Clause.prototype.evaluate = function (scope)
	{
		return false;

		console.log(['Clause.evaluate']);
		if (!this.clause || this.clause.length == 0)
		{
			throw new Error('zero check options');
			return false;
		}

		for (var i = 0, ii = this.clause.length; i < ii; i++)
		{
			var name = this.clause[i];
			if (name in scope)
			{
				var value = scope[name];
				if (typeof value === 'object')
				{
					if (typeof value.splice === 'function')
					{
						if (value.length == 0)
						{
							console.log(['Clause.evaluate', 'empty array ' + name]);
							return false;
						}
					}
					else
					{
						var has = false;
						for (var key in value)
						{
							has = true;
							break;
						}
						if (!has)
						{
							console.log(['Clause.evaluate', 'empty object ' + name]);
							return false;
						}
					}
				}
				else if (typeof value === 'function')
				{
					value = value();
					if (!value)
					{
						console.log(['Clause.evaluate', 'falsy return value ' + name]);
						return false;
					}
				}
				else
				{
					if (!value)
					{
						console.log(['Clause.evaluate', 'falsy value ' + name]);
						return false;
					}
				}
			}
			else
			{
				throw new Error('undefined scope prop '+name);
			}
		}
		console.log(['Clause.evaluate ok!',scope, this.clause]);
		return true;
	};
	return expose;
});