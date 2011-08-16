// Bracket Plugin | Gracket (jquery.gracket.js)
// Erik Zettersten
// Version 1.8

(function($) {
	$.fn.gracket = function(method) {
		
		// Defaults
		$.fn.gracket.defaults = {
			gameClass : "g_game",
			roundClass : "g_round",
			teamClass : "g_team",
			winnerClass : "g_winner",
			spacerClass : "g_spacer",
			currentClass : "g_current",
			cornerRadius : 5,
			canvasId : "g_canvas",
			canvasClass : "g_canvas",
			canvasLineColor : "white",
			canvasLineWidth : 1,
			canvasLineGap : 2,
			canvasLineCap : "round",
			src : null
		}
		
		// global
		var 
			container = this,
			data = JSON.parse(container.data("gracket")) || JSON.parse(this.gracket.defaults.src),
			team_count,
			round_count,
			game_count
		;
		
		// Defaults => Settings
		$.fn.gracket.settings = {}

		// Public methods
		var methods = {
			init : function(options) {
				
				this.gracket.settings = $.extend({}, this.gracket.defaults, options);
				
				// build empty canvas
				container.append("<canvas id='"+ this.gracket.settings.canvasId +"' style=\"position:absolute;top:0;left:0;\" />");
				
						
				//  create rounds
				round_count = data.length;
				for (var r=0; r < round_count; r++) {
					
					var round_html = helpers.build.round(this.gracket.settings);
					container.append(round_html);		
		
					// create games in round
					game_count = data[r].length;		
					for (var g=0; g < game_count; g++) {
						
					
						var 
							game_html = helpers.build.game(this.gracket.settings),
							outer_height = container.find("." + this.gracket.settings.gameClass).outerHeight(true),
							spacer = helpers.build.spacer(this.gracket.settings, outer_height, r, (r !== 0 && g === 0) ? true : false)
						;
						
						
						// append spacer
						if (g % 1 == 0 && r !== 0) round_html.append(spacer);
						
						// append game
						round_html.append(game_html);
						
						// create teams in game
						team_count = data[r][g].length;
						for (var t=0; t < team_count; t++) {
		
							var team_html = helpers.build.team(data[r][g][t], this.gracket.settings, t);
							game_html.append(team_html);							
							
							// adjust winner
							if (team_count === 1) {
								
								// remove spacer
								game_html.prev().remove()
								
								// align winner
								helpers.align.winner(game_html, this.gracket.settings, game_html.parent().prev().children().eq(0).height());

								// init the listeners after gracket is built
								helpers.listeners(this.gracket.settings, data, game_html.parent().prev().children().eq(1));
								
							}
		
						};
		
					};
					
				};
			}
		
		};
		
		// Private methods
		var helpers = {
			build : {
				team : function(data, node, t){
					return team = $("<div />", {
						"html" : "<h3><span>"+ (data.win || 0) +"</span>"+ data.name +"</h3>",
						"class" : "{userid:" + (data.userid || 0) + ",id:" + (data.id || 0) + "} " + node.teamClass + " t" + t + (data.winner == 'Y' ? ' winner' : '')
					});
				},
				game : function(node){
					return game = $("<div />", {
						"class" : node.gameClass
					});
				},
				round : function(node){
					return round = $("<div />", {
						"class" : node.roundClass
					});
				},
				spacer : function(node, yOffset, r, isFirst){
					return spacer = $("<div />", {
						"class" : node.spacerClass
					}).css({
						"height" : (isFirst) ?  (((Math.pow(2, r)) - 1) * (yOffset / 2)) : ((Math.pow(2, r) -1) * yOffset)
					});
				},
				canvas : {
					resize : function(node){
						var canvas = document.getElementById(node.canvasId);
						canvas.height = container.innerHeight();
						canvas.width = container.innerWidth();
						$(canvas).css({
							height : container.innerHeight(),
							width : container.innerWidth(),
							zIndex : 1,
							pointerEvents : "none"
						});
					},				
					draw : function(node, data, game_html){						
						
						var canvas = document.getElementById(node.canvasId);
						var ctx = (canvas.getContext("2d") || false);
						if(ctx){
							// set starting position -- will default to zero
							var 
								_itemWidth = game_html.outerWidth(true),
								_itemHeight = game_html.outerHeight(true),
								_paddingLeft = (parseInt(container.css("paddingLeft")) || 0),
								_paddingTop = (parseInt(container.css("paddingTop")) || 0),
								_marginBottom = (parseInt(game_html.css("marginBottom")) || 0),
								_startingLeftPos = _itemWidth + _paddingLeft,
								_marginRight = (parseInt(container.find("> div").css("marginRight")) || 0),
								_cornerRadius = node.cornerRadius,
								_lineGap = node.canvasLineGap,
								_playerHt = game_html.find("> div").eq(1).height()
							;
							
							//We must put a restriction on the corner radius and the line gap
							if (_cornerRadius > _itemHeight/3) _cornerRadius = _itemHeight/3;
							
							if (_cornerRadius > _marginRight/2) _cornerRadius = _marginRight/2 - 2;
							
							if (_cornerRadius <= 0) _cornerRadius = 1;
								
							if (_lineGap > _marginRight/3) _lineGap = _marginRight/3;						
							
							
							// set styles
							ctx.strokeStyle = node.canvasLineColor;
							ctx.lineCap = node.canvasLineCap;
							ctx.lineWidth = node.canvasLineWidth;
							
							// only need to start path once
							ctx.beginPath();												
							
							var 
								p = Math.pow(2, data.length - 2),
								i = 0,
								j,
								r = 0.5
							;
							
							while (p >= 1) {
								
								for (j = 0; j < p; j++) {																
									
									if (p == 1) r = 1;
									
									var 
										xInit = _startingLeftPos + i*_itemWidth + i*_marginRight,
										xDisp = r*_marginRight,
										yInit = ((Math.pow(2, i-1) - 0.5)*(i&&1) + j*Math.pow(2, i))*_itemHeight + _paddingTop + _playerHt
									;
									
									//Line foward
									ctx.moveTo(xInit + _lineGap, yInit);
									
									if (p > 1)
										ctx.lineTo(xInit + xDisp - _cornerRadius, yInit);
									else 
										ctx.lineTo(xInit + xDisp, yInit);								
									
									//Line backward
									if (p < Math.pow(2, data.length - 2)) {
										ctx.moveTo(xInit - _itemWidth - _lineGap, yInit);
										ctx.lineTo(xInit - _itemWidth - 0.5*_marginRight, yInit);								
									}
									
									//Connecting Lines
									if (p > 1 && j % 2 == 0) {
										ctx.moveTo(xInit + xDisp, yInit + _cornerRadius);
										ctx.lineTo(xInit + xDisp, yInit + Math.pow(2, i)*_itemHeight - _cornerRadius);	
	
										//Here comes the rounded corners
										var 
											_cx = xInit + xDisp - _cornerRadius,
											_cy = yInit + _cornerRadius
										;
										
										ctx.moveTo(_cx, _cy - _cornerRadius);
										ctx.arcTo(_cx + _cornerRadius, _cy - _cornerRadius, _cx + _cornerRadius, _cy, _cornerRadius);
										
										_cy = yInit + Math.pow(2, i)*_itemHeight - _cornerRadius;	
										ctx.moveTo(_cx + _cornerRadius, _cy - _cornerRadius);
										ctx.arcTo(_cx + _cornerRadius, _cy + _cornerRadius, _cx, _cy + _cornerRadius, _cornerRadius);									
									}								
								}
								i++;
								p = (p / 2);
							}						
							
							// only need to stoke the path once			
							ctx.stroke();
							
						}				
					}
				}
			},
			align : {
				winner : function(game_html, node, yOffset){
					return game_html.addClass(node.winnerClass).css({ 
						"margin-top" : yOffset + (game_html.height() / 2)
					});
				}
			}, 
			listeners : function(node, data, game_html){	
				
				// 1. Hover Trail
				
				/*
				var _gameSelector = "." + node.teamClass + " > h3";
				$.each($(_gameSelector), function(e){
					var id = "." + $(this).parent().attr("class").split(" ")[1];
					if (id !== undefined) {
						$(id).hover(function(){
							$(id).addClass(node.currentClass);
						}, function(){
							$(id).removeClass(node.currentClass);
						});
					};
				});
				*/
				// 2. size the canvas
				helpers.build.canvas.resize(node);
				helpers.build.canvas.draw(node, data, game_html);
				// 3. add tooltip
				
				
			}
		};
	
		// if a method as the given argument exists
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error( 'Method "' +  method + '" does not exist in gracket!');
		}
	
	}

})(jQuery);

// Call Plugin
$("[data-gracket]").gracket();





