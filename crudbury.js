/*
    Copyright © 2013, 2014 Aaron John Schlosser

    This file is part of Crudbury by Aaron John Schlosser.

    Crudbury is free software: you can redistribute it and/or modify
    it under the terms of the MIT License.

    Crudbury is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the MIT License
    along with Crudbury.  If not, see <http://opensource.org/licenses/MIT>.
*/
//array prototypes
Array.prototype.sortByProp = function (p) {
    return this.sort(function (a, b) {
        return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
    });
}
Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

/***********************
         GAME          
***********************/

var Game = {
    fps: 60,
    frames: 0,
    ticks: 0,
    month: 0,
    year: 2331,
    tickInterval: 1,
    fontSize: 24,
    engine: null,
    intervalId: null,
    run: function () {
        var g = Game;
        var u = g.engine.ui;
        g.frames++;
            if (g.frames > g.fps / g.tickInterval) {
                g.ticks++;
                g.frames = 0;
                if (g.month < 12) g.month++;
                else {
                    g.month = 0;
                    g.year++;
                }
            }
            handleInput();
            renderEverything();
    }
};
Game.engine = new Engine();
Game._intervalId = setInterval(Game.run, 1000 / Game.fps);

function init() {
    var g = Game;
    var e = g.engine;
    var u = e.ui;
    var body = document.getElementsByTagName('body')[0];
    u.getElems();
    createMap();
    u.canvas.addEventListener('click', function (evt) {
        e.mouse.setCoords(u.canvas, evt, e.mouse);
    }, false);
}

/***********************
         ENGINE          
***********************/

function Engine() {
    this.effects = new Effects();
    this.ui = new UserInterface();
    this.mouse = new Mouse();
    this.map = new Map(640, 640, 32);
    this.clock = new Clock();
    this.destinations = [];
    this.connections = [];
    this.getDestByName = function (n) {
        var d = this.destinations;
        for (var i = 0; i < d.length; i++) {
            if (d[i].name == n) return i;
        }
        return -1;
    };
    this.getDestByCoords = function (x,y) {
        var d = this.destinations;
        for (var i = 0; i < d.length; i++) {
            if (d[i].tileX == x && d[i].tileY == y) return i;
        }
        return -1;
    };
    this.selDestByConn = function (conn,s) {
        var c = this.connections;
        for (var i = 0; i < c.length; i++) {
            if (s) c[i].visible = false;
            else c[i].visible = true;
            if (c[i].name == conn.id) {
                if (s) {
                    c[i].visible = true;
                    c[i].begin.selected = true;
                    c[i].end.selected = true;
                } else {
                    c[i].begin.selected = false;
                    c[i].end.selected = false;
                }
            }
        }
    };
    this.clearScreen = function () { Game.engine.ui.canvas.width = Game.engine.ui.canvas.width; };
    this.drawRect = function (color,x,y,w,h) {
        var c = Game.engine.ui.context;
        var m = Game.engine.map;
        w = typeof w !== 'undefined' ? w : m.tileSize;
        h = typeof h !== 'undefined' ? h : m.tileSize;
        c.beginPath()
        c.rect(x*w, y*h, w, h);
        c.fillStyle = color;
        c.fill();
    };
    this.drawLine = function (x1,y1,x2,y2,color,w) {
        var c = Game.engine.ui.context;
        var m = Game.engine.map;
        w = typeof w !== 'undefined' ? w : 1;
        color = typeof color !== 'undefined' ? color : 'black';
        c.lineWidth = w;
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.strokeStyle = color;
        c.stroke();
    };
    this.drawCirc = function (x,y,r,b,colorC,colorB) {
        var c = Game.engine.ui.context;
        r = typeof r !== 'undefined' ? r : Game.engine.map.tileSize/2;
        b = typeof b !== 'undefined' ? b : 0;
        colorC = typeof colorC !== 'undefined' ? colorC : 'black';
        colorB = typeof colorB !== 'undefined' ? colorB : 'black';
        c.beginPath();
        c.arc(x,y,r,0,Math.PI * 2);
        c.closePath();
        c.fillStyle = colorC;
        c.fill();
        if (b > 0) {
            c.lineWidth = b;
            c.strokeStyle = colorB;
            c.stroke();
        }
    };
    this.drawText = function (t,x,y,col,s) {
        var c = Game.engine.ui.context;
        col = typeof col !== 'undefined' ? col : "black";
        s = typeof s !== 'undefined' ? s : "bold 0.75em Courier";
        c.fillStyle = col;
        c.font = s;
        c.fillText(t,x,y);
    };
    this.renderTiles = function () {
        var ts = Game.engine.map.tiles;
        for (var i = 0; i < ts.length; i++) {
            var t = ts[i];
            var type = t.type;
            var c = "black";
            switch (type) {
            case "grass":
                c = "lightgray";
                break;
            case "water":
                c = "#393939";
                break;
            case "mountain":
                c = "dimgray";
                break;
            }
            this.drawRect(c,t.x,t.y);
        }
    };
    this.renderGrid = function () {
        var m = Game.engine.map;
        var ts = m.tileSize;
        for (var x = 0; x < 20; x++) { this.drawLine(x*ts,0,x*ts,m.w*ts,"gray") }
        for (var y = 0; y < 20; y++) { this.drawLine(0,y*ts,m.h*ts,y*ts,"gray") }
    };
}

//effects
function Effects() {
    this.texts = [];
    function Text(s,x,y) {
        this.str = s;
        this.x = x;
        this.y = y;
        this.fading = false;
        this.alpha = 1;
        this.fade = function () {
            this.y -= 0.5;
            this.alpha -= 0.05;
            this.speed = 0;
        }
    }
    this.fadeText = function (s,x,y) {
        var t = new Text(s,x,y);
        t.fading = true;
        this.texts.push(t);
    };
    this.process = function () {
        var t = this.texts;
        var e = Game.engine;
        for (var i = t.length - 1; i >= 0; i--) {
            var c = "rgba(255,255,255," + t[i].alpha + ")";
            e.drawText(t[i].str,t[i].x,t[i].y,c,"bold 1.1em Courier");
            if (t[i].fading) {
                t[i].fade();
            }
            if (t[i].alpha <= 0) t.splice(i, 1);
        }
    };
}

// math functions
function getRandInt(mn,mx) { return Math.floor(Math.random()*(mx-mn+1)+mn); }
function getLineLen(a,b) { return Math.round(Math.sqrt(Math.pow((a.x-b.x),2)+Math.pow((a.y-b.y),2))); }
function getLineSlope(a,b) { return Math.round((a.y-b.y)/(a.x-b.x)); }

// metadata functions
function getRandName() {
    var p = object.destination.name.prefix;
    var s = object.destination.name.suffix;
    var n = p[getRandInt(0,p.length-1)]+s[getRandInt(0,s.length-1)];
    return n;
}

/***********************
         MAP          
***********************/

function Tile(x,y,t) {
    this.x = x;
    this.y = y;
    this.type = t;
}

function Map(w,h,s) {
    this.tileSize = s;
    this.w = w / s;
    this.h = h / s;
    this.tiles = [];
}

function createMap() {
    var e = Game.engine;
    for (var i = 0; i < 8; i++) {
        var found_coordinates = false;
        while (!found_coordinates) {
            var x = getRandInt(2, 18);
            var y = getRandInt(2, 18);
            if (e.getDestByCoords(x, y) == -1) {
                found_coordinates = true;
                var found_name = false;
                while (!found_name) {
                    var n = getRandName();
                    if (e.getDestByName(n) == -1) {
                        var d = new Destination(x,y,n);
                        found_name = true;
                    }
                }
            }
        }
    }
    var m = e.map;
    for (var x = 0; x < m.w; x++) {
        for (var y = 0; y < m.h; y++) {
            var t = new Tile(x,y,"grass");
            var c = getRandInt(0, 100);
            if (c > 80) t.type = "water";
            if (c > 95) t.type = "mountain";
            m.tiles.push(t);
        }
    }
}

/***********************
         CLOCK          
***********************/

function Clock() {
    this.lastTicks, this.ticks = Game.ticks;
}
Clock.prototype.getTicks = function () { return Game.ticks - this.ticks; };
Clock.prototype.reset = function () { this.ticks = Game.ticks; };
Clock.prototype.ticked = function () {
    if (this.getTicks() > Game.tickInterval) {
        this.reset();
        return true;
    } else return false;
};
Clock.prototype.tickedByThismuch = function (i) {
    if (this.getTicks() > i) {
        this.reset();
        return true;
    }
    return false;  
};

/***********************
       INTERFACE          
***********************/

// mouse
function Mouse() {
    this.x = 0;
    this.y = 0;
    this.clicked = false;
    this.currentTarget = 0;
    this.lastTarget = 0;
    this.reset = function () {
        this.x = 0;
        this.y = 0;
        this.clicked = false;
    };
    this.setCoords = function (canvas, evt) {
        var rect = Game.engine.ui.canvas.getBoundingClientRect();
        this.x = evt.clientX - rect.left;
        this.y = evt.clientY - rect.top;
        this.clicked = true;
    };
}

function checkIfCircleClicked(c,r) {
    var m = Game.engine.mouse;
    var x = m.x-c.x;
    var y = m.y-c.y;
    if (x*x+y*y <= r*r) return true;
    else return false;
}

// user interface
function UserInterface() {
    function Window(i) {
        this.element = document.getElementById(""+ i +"");
    }
    this.titleMessage = "";
    this.clock = new Clock();
    this.getElems = function () {
        this.canvas = document.getElementById('game');
        this.context = this.canvas.getContext('2d');
        this.gameWindow = document.getElementById('game_window');
        this.panel = {
            header: new Window('header'),
            top: new Window('top'),
            left: new Window('left'),
            right: new Window('right'),
            footer: new Window('footer'),
            dialog: new Window('dialog')
        }
    };
}

/***********************
         INPUT          
***********************/

function handleInput() {
    var g = Game;
    var e = g.engine;
    var m = e.mouse;
    var d = e.destinations;
    if (m.clicked) {
        var match = false;
        for (var i = 0; i < d.length; i++) {
            if (checkIfCircleClicked(d[i], 10)) {
                if (m.currentTarget == d[i]) {
                    if (m.currentTarget.selected) m.currentTarget.selected = false;
                    else if (!m.currentTarget.selected) m.currentTarget.selected = true;
                } else {
                    m.lastTarget.selected = false;
                    m.lastTarget = m.currentTarget;
                    m.currentTarget = d[i];
                    m.currentTarget.selected = true;
                }
                match = true;
            }
        }
        if (match == false) {
            for (var i = 0; i < d.length; i++) {
                d[i].selected = false;
            }
        }
        if (m.currentTarget.selected && m.lastTarget.selected) var c = new Connection(m.lastTarget, m.currentTarget);
    }
    m.reset();
}

/***********************
        OBJECTS          
***********************/

// destinations
function Destination(x,y,n) {
    var m = Game.engine.map;
    var d = object.destination;
    var p = d.population;
    this.x = x*m.tileSize;
    this.y = y*m.tileSize;
    this.tileX = x;
    this.tileY = y;
    this.name = n;
    this.connections = [];
    this.totalConnectionValue = 0;
    this.clock = new Clock();
    function Population() {
        this.value = getRandInt(1,10000);
        this.grow = function () {
            var change = Math.round(Math.sqrt(this.value/1000));
            this.value += change;
            if (p.milestone.length == p.description.length) {
                for (var i = 0; i < p.milestone.length; i++) {
                    if (this.value > p.milestone[i]) {
                        this.description = p.description[i];
                    } else if (this.value < p.milestone[0]) this.description = "insignificant settlement";
                }
            } else this.description = "place";
        };
    }
    this.population = new Population();
    this.population.grow();
    this.description = d.description[getRandInt(0, d.description.length-1)];
    function Geography() {
        this.type = d.geography.type[getRandInt(0, d.geography.type.length-1)];
        this.value = getRandInt(0, d.geography.description.length-1);
        this.description = d.geography.description[this.value];
        this.modifier = d.geography.modifier[this.value];

    }
    this.geography = new Geography();
    this.baseValue = getRandInt(1,1000)*Math.sqrt(this.population.value/2000);
    this.market = new StockMarket();
    var g = object.good;
    function Factory() {
        this.productivity = 50;
        this.type = getRandInt(0, g.type.length-1);
        this.product = g.type[this.type];
        this.value = g.value[this.type];
        this.clock = new Clock();
    }
    this.factory = new Factory();
    this.factory.productivity = Math.round(50/(this.population.value/2000));
    var e = Game.engine;
    e.destinations.push(this);
    this.receiveGood = function (good) {
        var c = e.connections;
        for (var i = 0; i < c.length; i++) {
            var newGoods = [];
            for (var g = 0; g < c[i].goods.length; g++) {
                if (c[i].goods[g].id == good.id) {
                    c[i].lastGoodValue = Math.round(good.value*(Math.sqrt(this.population.value/1000)));
                    c[i].value += c[i].lastGoodValue;
                    e.effects.fadeText("+ " + c[i].lastGoodValue + "", good.x, good.y);
                } else newGoods.push(c[i].goods[g]);
            }
            c[i].goods = newGoods;
        }
    };
    this.render = function() {
        var e = Game.engine;
        var c = e.ui.context;
        var b = 0;
        var cc = "black";
        var cb = "black";
        if (this.selected) {
            cc = "lightgray";
            b = 5;
            cb = "dimgray";
        }
        e.drawCirc(this.x,this.y,10,b,cc,cb);
        e.drawText(this.name,this.x-25,this.y+20,"black","bold 1em Courier");
    }
}

// connections
function Connection(a,b) {
    var e = Game.engine;
    var u = e.ui;
    this.visible = true;
    this.begin = a;
    this.end = b;
    this.length = getLineLen(a,b);
    this.slope = getLineSlope(a,b);
    this.name = a.name + " to " + b.name;
    this.distanceModifier = getRandInt(80,120);
    this.speed = 1;
    this.value = Math.round((a.baseValue+b.baseValue)*Math.sqrt(this.length/this.distanceModifier));
    this.lastGoodValue = 0;
    this.goods = [];
    this.clock = new Clock();
    this.market = new StockMarket();
    a.market.connections.push(this);
    b.market.connections.push(this);
    e.connections.push(this);
    this.evaluate = function () {
        var t = this;
        var a = t.begin;
        var b = t.end;
        t.value += Math.round(Math.sqrt((a.baseValue+a.population.value)/3)+Math.sqrt((b.baseValue+b.population.value)/3)+Math.sqrt(t.length/t.distanceModifier)/2)*t.market.modifier;
        if (t.value < 0) t.value = 0;
    };
    this.moveGood = function () {
        this.goods.push(new Good(this));
    };
}
function deleteConnection(con) {
    var c = Game.engine.connections;
    for (var i = 0; i < c.length; i++) {
        if (c[i].name === con.id) {
            Game.engine.ui.panel.footer.update("By order of the Crudbury Committee on Punctuality, the connection from " + Game.engine.connections[i].name + " has been summarily destroyed.");
            c.splice(i, 1);
        }
    }
    var d = Game.engine.destinations;
    for (var i = 0; i < d.length; i++) {
        for (var j = 0; j < d[i].connections.length; j++) {
            if (d[i].market.connections[c].name === con.id) {
                d[i].market.connections.splice(j, 1);
            }
        }
    }
}

// markets
function StockMarket() {
    this.modifier = 1;
    this.happy = true;
    this.clock = new Clock();
    this.mood = ":D";
    this.volatilityDescription = "";
    this.volatility = 0;
    this.value = 0;
    this.connections = [];
    this.evaluate = function () {
        this.value = 0;
        for (var i = 0; i < this.connections.length; i++) {
            this.value += this.connections[i].value;
        }
    };
    this.setVolatility = function () {
        var n = getRandInt(1, 10);
        var desc = "";
        this.volatility = n;
        if (n < 3) desc = "calm and punctual";
        if (n >= 3) desc = "thinking things over";
        if (n >= 5) desc = "frequently forgetting what it was going to say";
        if (n >= 7) desc = "having arguments with people in its sleep";
        if (n >= 9) {
            var things = ["the weather", "all the dogs running about", "greeting cards", "potted plants", "birthdays", "holidays", "mothers-in-law", "text messages", "secret night visits", "loud sirens", "the smell of smoke", "all the dust everywhere", "cheese", "ghostly apparitions", "daytime television", "long-lost friends", "long lines"];
            var chance = getRandInt(0, things.length - 1);
            desc = "feeling extremely anxious about " + things[chance];
        }
        if (n == 10) desc = "perturbed and agitated";
        this.volatilityDescription = desc;
    };
    this.setVolatility();
    this.change = function () {
        this.setVolatility();
        this.modifier = getRandInt(1, 3);
        if (this.happy == false) this.modifier = -this.modifier;
        var moodChance = getRandInt(1, 100);
        if (moodChance > (100 - (this.volatility * 2))) {
            this.changeMood();
        }
    };
    this.changeMood = function () {
        if (this.happy == true) {
            this.happy = false;
            this.mood = "D:";
            this.modifier = -this.modifier;
        } else {
            this.happy = true;
            this.mood = ":D";
            this.modifier = Math.abs(this.modifier);
        }
    };
}

function Good(connection) {
    var c = connection.begin;
    this.value = Math.round(c.factory.value * c.geography.modifier);
    this.description = c.factory.product;
    this.x = connection.begin.x;
    this.y = connection.begin.y;
    this.x1 = connection.begin.x;
    this.y1 = connection.begin.y
    this.x2 = connection.end.x;
    this.y2 = connection.end.y
    this.distance = connection.length;
    this.distanceToGo = connection.length;
    this.movement = 0;
    this.clock = new Clock();
    this.move = function (speed) {
        this.id = getRandInt(0, 10000000) + Game.ticks;
        this.movement++;
        if (this.movement < speed) return false;
        else this.movement = 0;
        var x = this.x;
        var y = this.y;
        var x1 = this.x1;
        var x2 = this.x2;
        var y1 = this.y1;
        var y2 = this.y2;
        var d = this.distance;
        if (x1 - x2 < 0 && y1 - y2 < 0) {
            x = x + Math.abs(((x1 - x2) / d));
            y = y + Math.abs(((y1 - y2) / d));
        }
        if (x1 - x2 > 0 && y1 - y2 > 0) {
            x = x - Math.abs(((x1 - x2) / d));
            y = y - Math.abs(((y1 - y2) / d));
        }
        if (x1 - x2 < 0 && y1 - y2 > 0) {
            x = x + Math.abs(((x1 - x2) / d));
            y = y - Math.abs(((y1 - y2) / d));
        }
        if (x1 - x2 > 0 && y1 - y2 < 0) {
            x = x - Math.abs(((x1 - x2) / d));
            y = y + Math.abs(((y1 - y2) / d));
        }
        if (x1 - x2 == 0 && y1 - y2 < 0) {
            y = y + Math.abs(((y1 - y2) / d));
        }
        if (x1 - x2 == 0 && y1 - y2 > 0) {
            y = y - Math.abs(((y1 - y2) / d));
        }
        if (x1 - x2 < 0 && y1 - y2 == 0) {
            x = x + Math.abs(((x1 - x2) / d));
        }
        if (x1 - x2 > 0 && y1 - y2 == 0) {
            x = x - Math.abs(((x1 - x2) / d));
        }
        this.x = x;
        this.y = y;
        this.distanceToGo--;
        if (this.distanceToGo <= 0) {
            var c = Game.engine.connections;
            for (var i = 0; i < c.length; i++) {
                for (var g = 0; g < c[i].goods.length; g++) {
                    if (c[i].goods[g].id == this.id) c[i].end.receiveGood(this);
                }
            }
        }
    };
    this.render = function() {
        var e = Game.engine;
        var c = e.ui.context;
        e.drawCirc(this.x, this.y,5,1,"dimgray","black");
        e.drawText(this.value,this.x+6,this.y);
    };
}

/***********************
        RENDERER          
***********************/

function renderLine(line) {
    if (line.visible == true) {
        var w = 1 + line.value / 1000;
        if (w < 2) w = 2;
        else if (w > 15) w = 15;
        Game.engine.drawLine(line.begin.x, line.begin.y,line.end.x,line.end.y,"white",w);
    }
}

function renderEverything() {
    var e = Game.engine;
    e.clearScreen();
    e.renderTiles();
    e.renderGrid();
    var cs = e.connections;
    for (var i = 0; i < cs.length; i++) {
        var c = cs[i];
        if (c.market.clock.tickedByThisMuch(c.market.volatility * 2)) c.market.change();
        if (c.clock.ticked()) c.evaluate();
        var id = cs[i].name;
        renderLine(cs[i]);
    }
    for (var i = 0; i < Game.engine.destinations.length; i++) {
        var d = Game.engine.destinations[i];
        if (d.market.clock.tickedByThisMuch(d.market.volatility * 2)) d.market.change();
        if (d.clock.tickedByThisMuch(10000 / d.population.value)) d.population.grow();
        if (d.factory.clock.tickedByThisMuch(d.factory.productivity)) {
            for (var c = 0; c < Game.engine.connections.length; c++) {
                if (Game.engine.connections[c].begin.name == d.name) {
                    Game.engine.connections[c].moveGood();
                }
            }
        }
        d.market.evaluate();
        d.render();
    }
    for (var i = 0; i < Game.engine.connections.length; i++) {
        for (var g = 0; g < Game.engine.connections[i].goods.length; g++) {
            Game.engine.connections[i].goods[g].move(Game.engine.connections[i].speed);
        }
    }
    for (var i = 0; i < Game.engine.connections.length; i++) {
        for (var g = 0; g < Game.engine.connections[i].goods.length; g++) {
            Game.engine.connections[i].goods[g].render();
        }
    }
    Game.engine.effects.process();
}

init();