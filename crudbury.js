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
            u.statusWindow.innerHTML = "Month " + g.month + ", Year " + g.year + " | " + u.statusMessage;
            handlePlayerInput();
            renderEverything();
    }
}
Game.engine = new Engine();
Game._intervalId = setInterval(Game.run, 1000 / Game.fps);

function init() {
    var g = Game;
    var e = g.engine;
    var u = e.ui;
    var body = document.getElementsByTagName('body')[0];
    u.getDOMElements();
    createMap();
    u.canvas.addEventListener('click', function (evt) {
        e.mouse.setCoordinates(u.canvas, evt, e.mouse);
    }, false);
}

/***********************
         ENGINE          
***********************/

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
    }
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
    }
}

//effects
function Effects() {
    this.texts = [];

    function Text(str, x, y) {
        this.str = str;
        this.x = x;
        this.y = y;
        this.fading = false;
        this.alpha = 1;
        0;
        Text.prototype.fade = function () {
            this.y -= 0.5;
            this.alpha -= 0.05;
            this.speed = 0;
        }
    }
    Effects.prototype.fadeText = function (str, x, y) {
        var text = new Text(str, x, y);
        text.fading = true;
        this.texts.push(text);
    }
    Effects.prototype.process = function () {
        for (var t = this.texts.length - 1; t >= 0; t--) {
            Game.engine.ui.context.fillStyle = "rgba(255, 255, 255, " + this.texts[t].alpha + ")";
            Game.engine.ui.context.font = "bold 1.1em Courier";
            Game.engine.ui.context.fillText(this.texts[t].str, this.texts[t].x, this.texts[t].y);
            if (this.texts[t].fading) {
                this.texts[t].fade();
            }
            if (this.texts[t].alpha <= 0) this.texts.splice(t, 1);
        }
    }
}

// math methods
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getLengthOfLine(begin, end) {
    return Math.round(Math.sqrt(Math.pow((begin.x - end.x), 2) + Math.pow((begin.y - end.y), 2)));
}

function getSlopeOfLine(begin, end) {
    return Math.round((begin.y - end.y) / (begin.x - end.x));
}

function getRandomName() {
    var prefix = ["Stone", "Middle", "Little", "Wen", "New", "Grove", "Haver", "Brad", "Lynn", "Wor", "Law", "Ames", "Tewks", "Box", "Dan", "Marl",
        "Waver", "Nor", "Billing", "Strat", "Bever", "Sud", "Pel", "Plai", "Sea", "Shrews", "George", "Charles", "Am", "East"
    ];
    var suffix = ["field", "ham", "ton", "wich", "hill", "borough", "town", "ly", "castle", "chester", "chester-by-the-sea", "port", "ford", "over",
        "stowe", "stow", "brook", "bridge", "worth", "mouth", "hampton", "worth-by-the-sea"
    ];
    var name = prefix[getRandomInt(0, prefix.length - 1)] + suffix[getRandomInt(0, suffix.length - 1)];
    return name;
}

// map methods
function Tile(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
}

function Map(w, h, tileSize) {
    this.tileSize = tileSize;
    this.w = w / tileSize;
    this.h = h / tileSize;
    this.tiles = [];
}

function createMap() {
    for (var i = 0; i < 8; i++) {
        var found_coordinates = false;
        while (!found_coordinates) {
            var x = getRandomInt(2, 18);
            var y = getRandomInt(2, 18);
            if (Game.engine.getDestByCoords(x, y) == -1) {
                found_coordinates = true;
                var found_name = false;
                while (!found_name) {
                    var name = getRandomName();
                    if (Game.engine.getDestByName(name) == -1) {
                        var destination = new Destination(x, y, name);
                        found_name = true;
                    }
                }
            }
        }
    }
    for (var x = 0; x < Game.engine.map.w; x++) {
        for (var y = 0; y < Game.engine.map.h; y++) {
            var tile = new Tile(x, y, "grass");
            var chance = getRandomInt(0, 100);
            if (chance > 80) tile.type = "water";
            if (chance > 95) tile.type = "mountain";
            Game.engine.map.tiles.push(tile);
        }
    }
}

// time
function Clock() {
    this.lastTicks = Game.ticks;
    this.ticks = Game.ticks;
}
Clock.prototype.getTicks = function () {
    return Game.ticks - this.ticks;
}
Clock.prototype.reset = function () {
    this.ticks = Game.ticks;
}
Clock.prototype.ticked = function () {
    if (this.getTicks() > Game.tickInterval) {
        this.reset();
        return true;
    } else return false;
}
Clock.prototype.tickedByThisMuch = function (tickInterval) {
    if (this.getTicks() > tickInterval) {
        this.reset();
        return true;
    } else return false;
}

// INTERFACE

// mouse
function Mouse() {
    this.x = 0;
    this.y = 0;
    this.clicked = false;
    this.currentTarget = 0;
    this.lastTarget = 0;
    Mouse.prototype.reset = function () {
        this.x = 0;
        this.y = 0;
        this.clicked = false;
    }
    Mouse.prototype.setCoordinates = function (canvas, evt) {
        var rect = Game.engine.ui.canvas.getBoundingClientRect();
        this.x = evt.clientX - rect.left;
        this.y = evt.clientY - rect.top;
        this.clicked = true;
    }
}

function checkIfCircleClicked(circle, radius) {
    var dx = Game.engine.mouse.x - circle.x;
    var dy = Game.engine.mouse.y - circle.y;
    if (dx * dx + dy * dy <= radius * radius) return true;
    else return false;
}

// user interface
function UserInterface() {
    this.displayContent = "";
    this.statusMessage = "";
    this.titleMessage = "";
    this.clock = new Clock();
    UserInterface.prototype.getDOMElements = function () {
        this.canvas = document.getElementById('game');
        this.context = this.canvas.getContext('2d');
        this.gameWindow = document.getElementById('game_window');
        this.statusWindow = document.getElementById('status');
        this.output = document.getElementById('output');
        this.dialog = document.getElementById('dialog');
        this.display = document.getElementsByClassName('display')[0];
        this.smallDisplays = document.getElementsByClassName('small_display');
    }
    UserInterface.prototype.displayDialog = function (message) {
        dialog.style.display = "block";
        dialog.innerHTML = "" + message + "";
        //var close = document.getElementById('close');
        //close.innerHTML = "a href='#close' title='Close' id='close' onClick='dialog.style.display=\"none\"'>X</a>"
    }
    UserInterface.prototype.render = function () {
        if (this.statusWindow.innerHTML != this.statusMessage.previous) {
            this.statusMessage.previous = this.statusWindow.innerHTML;
            this.statusWindow.innerHTML = "Month " + Game.month + ", Year " + Game.year + " | " + Game.engine.ui.statusMessage;
        }
    }
}

// handle all input
function handlePlayerInput() {
    if (Game.engine.mouse.clicked) {
        var match = false;
        for (var i = 0; i < Game.engine.destinations.length; i++) {
            if (checkIfCircleClicked(Game.engine.destinations[i], 10)) {
                if (Game.engine.mouse.currentTarget == Game.engine.destinations[i]) {
                    if (Game.engine.mouse.currentTarget.selected) Game.engine.mouse.currentTarget.selected = false;
                    else if (!Game.engine.mouse.currentTarget.selected) Game.engine.mouse.currentTarget.selected = true;
                } else {
                    Game.engine.mouse.lastTarget.selected = false;
                    Game.engine.mouse.lastTarget = Game.engine.mouse.currentTarget;
                    Game.engine.mouse.currentTarget = Game.engine.destinations[i];
                    Game.engine.mouse.currentTarget.selected = true;
                }
                match = true;
            }
        }
        if (match == false) {
            for (var i = 0; i < Game.engine.destinations.length; i++) {
                Game.engine.destinations[i].selected = false;
            }
        }
        if (Game.engine.mouse.currentTarget.selected && Game.engine.mouse.lastTarget.selected) var connection = new Connection(Game.engine.mouse.lastTarget, Game.engine.mouse.currentTarget);
    }
    Game.engine.mouse.reset();
}

// OBJECTS

// destinations
function Destination(x, y, name) {
    this.x = x * Game.engine.map.tileSize;
    this.y = y * Game.engine.map.tileSize;
    this.tileX = x;
    this.tileY = y;
    this.name = name;
    this.connections = [];
    this.totalConnectionValue = 0;
    this.clock = new Clock();

    function Population() {
        this.value = getRandomInt(1, 10000);
        Population.prototype.grow = function () {
            var change = Math.round(Math.sqrt(this.value / 1000));
            this.value += change;
            if (object.destination.population.milestone.length == object.destination.population.description.length) {
                for (var i = 0; i < object.destination.population.milestone.length; i++) {
                    if (this.value > object.destination.population.milestone[i]) {
                        this.description = object.destination.population.description[i];
                    } else if (this.value < object.destination.population.milestone[0]) this.description = "insignificant settlement";
                }
            } else this.description = "place";
        }
    }
    this.population = new Population();
    this.population.grow();
    this.description = object.destination.description[getRandomInt(0, object.destination.description.length - 1)];

    function Geography() {
        this.type = object.destination.geography.type[getRandomInt(0, object.destination.geography.type.length - 1)];
        this.value = getRandomInt(0, object.destination.geography.description.length - 1);
        this.description = object.destination.geography.description[this.value];
        this.modifier = object.destination.geography.modifier[this.value];

    }
    this.geography = new Geography();
    this.baseValue = getRandomInt(1, 1000) * Math.sqrt(this.population.value / 2000);
    this.market = new StockMarket();

    function Factory() {
        this.productivity = 50;
        this.type = getRandomInt(0, object.good.type.length - 1);
        this.product = object.good.type[this.type];
        this.value = object.good.value[this.type];
        this.clock = new Clock();
    }
    this.factory = new Factory();
    this.factory.productivity = Math.round(50 / (this.population.value / 2000));
    Game.engine.destinations.push(this);
    Destination.prototype.receiveGood = function (good) {
        var c = Game.engine.connections;
        for (var i = 0; i < c.length; i++) {
            var newGoods = [];
            for (var g = 0; g < c[i].goods.length; g++) {
                if (c[i].goods[g].id == good.id) {
                    c[i].lastGoodValue = Math.round(good.value * (Math.sqrt(this.population.value / 1000)));
                    c[i].value += c[i].lastGoodValue;
                    Game.engine.effects.fadeText("+ " + c[i].lastGoodValue + "", good.x, good.y);
                } else newGoods.push(c[i].goods[g]);
            }
            c[i].goods = newGoods;
        }
    }
}

// connections
function Connection(begin, end) {
    this.visible = true;
    this.begin = begin;
    this.end = end;
    this.length = getLengthOfLine(begin, end);
    this.slope = getSlopeOfLine(begin, end);
    this.name = begin.name + " to " + end.name;
    this.distanceModifier = getRandomInt(80, 120);
    this.speed = 1;
    this.value = Math.round((begin.baseValue + end.baseValue) * Math.sqrt(this.length / this.distanceModifier));
    this.lastGoodValue = 0;
    Game.engine.ui.statusMessage = "A connection from " + this.name + " has been established by the Crudbury Committee on Punctuality.";
    this.goods = [];
    this.clock = new Clock();
    this.market = new StockMarket();
    begin.market.connections.push(this);
    end.market.connections.push(this);
    Game.engine.connections.push(this);
    Connection.prototype.evaluate = function () {
        this.value +=
            Math.round(
                Math.sqrt((this.begin.baseValue + this.begin.population.value) / 3) + Math.sqrt((this.end.baseValue + this.end.population.value) / 3) + Math.sqrt(this.length / this.distanceModifier) / 2
        ) * this.market.modifier;
        if (this.value < 0) this.value = 0;
    }
    Connection.prototype.moveGood = function () {
        this.goods.push(new Good(this));
    }
}

function displayConnection(connection) {
    for (var i = 0; i < Game.engine.connections.length; i++) {
        if (connection.id === Game.engine.connections[i].name) {
            var message = "";
            message += "<table><th colspan=2>" + Game.engine.connections[i].name + "</th><tr><td>Volatility:</td><td>" + Game.engine.connections[i].market.volatility + "</td></tr></table>";
            smallDisplays[0].innerHTML = message;
        }
    }
}

function deleteConnection(connection) {
    for (var i = 0; i < Game.engine.connections.length; i++) {
        if (Game.engine.connections[i].name === connection.id) {
            Game.engine.ui.statusMessage = "By order of the Crudbury Committee on Punctuality, the connection from " + Game.engine.connections[i].name + " has been summarily destroyed.";
            Game.engine.connections.splice(i, 1);
        }
    }
    for (var i = 0; i < Game.engine.destinations.length; i++) {
        for (var c = 0; c < Game.engine.destinations[i].connections.length; c++) {
            if (Game.engine.destinations[i].market.connections[c].name === connection.id) {
                Game.engine.destinations[i].market.connections.splice(c, 1);
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
    this.setVolatility();
    this.value = 0;
    this.connections = [];
    StockMarket.prototype.evaluate = function () {
        this.value = 0;
        for (var i = 0; i < this.connections.length; i++) {
            this.value += this.connections[i].value;
        }
    }
}
StockMarket.prototype.setVolatility = function () {
    var n = getRandomInt(1, 10);
    var desc = "";
    this.volatility = n;
    if (n < 3) desc = "calm and punctual";
    if (n >= 3) desc = "thinking things over";
    if (n >= 5) desc = "frequently forgetting what it was going to say";
    if (n >= 7) desc = "having arguments with people in its sleep";
    if (n >= 9) {
        var things = ["the weather", "all the dogs running about", "greeting cards", "potted plants", "birthdays", "holidays", "mothers-in-law", "text messages", "secret night visits", "loud sirens", "the smell of smoke", "all the dust everywhere", "cheese", "ghostly apparitions", "daytime television", "long-lost friends", "long lines"];
        var chance = getRandomInt(0, things.length - 1);
        desc = "feeling extremely anxious about " + things[chance];
    }
    if (n == 10) desc = "perturbed and agitated";
    this.volatilityDescription = desc;
}

StockMarket.prototype.change = function () {
    this.setVolatility();
    this.modifier = getRandomInt(1, 3);
    if (this.happy == false) this.modifier = -this.modifier;
    var moodChance = getRandomInt(1, 100);
    if (moodChance > (100 - (this.volatility * 2))) {
        this.changeMood();
    }
}
StockMarket.prototype.changeMood = function () {
    if (this.happy == true) {
        this.happy = false;
        this.mood = "D:";
        this.modifier = -this.modifier;
    } else {
        this.happy = true;
        this.mood = ":D";
        this.modifier = Math.abs(this.modifier);
    }
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
    Good.prototype.move = function (speed) {
        this.id = getRandomInt(0, 10000000) + Game.ticks;
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
    }
}

// RENDER

function clearScreen() {
    Game.engine.ui.canvas.width = Game.engine.ui.canvas.width;
}

function renderDestination(circle) {
    Game.engine.ui.context.beginPath();
    Game.engine.ui.context.arc(circle.x, circle.y, 10, 0, Math.PI * 2, true);
    Game.engine.ui.context.closePath();
    if (circle.selected) {
        Game.engine.ui.context.fillStyle = "lightgray";
        Game.engine.ui.context.lineWidth = 5;
        Game.engine.ui.context.strokeStyle = "dimgray";
        Game.engine.ui.context.stroke();
    } else Game.engine.ui.context.fillStyle = "black";
    Game.engine.ui.context.fill();
    Game.engine.ui.context.fillStyle = "black";
    Game.engine.ui.context.font = "bold 1em Courier";
    Game.engine.ui.context.fillText(circle.name, circle.x - 25, circle.y + 20);
}

function renderGood(good) {
    Game.engine.ui.context.beginPath();
    Game.engine.ui.context.arc(good.x, good.y, 5, 0, Math.PI * 2, true);
    Game.engine.ui.context.closePath();
    Game.engine.ui.context.fillStyle = "dimgray";
    Game.engine.ui.context.fill();
    Game.engine.ui.context.lineWidth = 1;
    Game.engine.ui.context.strokeStyle = "black";
    Game.engine.ui.context.stroke();
    Game.engine.ui.context.fillStyle = "black";
    Game.engine.ui.context.font = "bold 0.75em Courier";
    Game.engine.ui.context.fillText(good.value, good.x + 6, good.y);
}

function renderLine(line) {
    if (line.visible == true) {
        Game.engine.ui.context.beginPath();
        Game.engine.ui.context.moveTo(line.begin.x, line.begin.y);
        Game.engine.ui.context.lineTo(line.end.x, line.end.y);
        Game.engine.ui.context.lineWidth = 2;
        Game.engine.ui.context.lineWidth = 1 + line.value / 1000;
        if (Game.engine.ui.context.lineWidth < 2) Game.engine.ui.context.lineWidth = 2;
        else if (Game.engine.ui.context.lineWidth > 15) Game.engine.ui.context.lineWidth = 15;
        Game.engine.ui.context.strokeStyle = "white";
        Game.engine.ui.context.stroke();
    }
}

function renderGrid() {
    for (var x = 0; x < 20; x++) {
        Game.engine.ui.context.beginPath();
        Game.engine.ui.context.moveTo(x * Game.engine.map.tileSize, 0);
        Game.engine.ui.context.lineTo(x * Game.engine.map.tileSize, Game.engine.map.w * Game.engine.map.tileSize);
        Game.engine.ui.context.strokeStyle = "gray";
        Game.engine.ui.context.stroke();
    }
    for (var y = 0; y < 20; y++) {
        Game.engine.ui.context.beginPath();
        Game.engine.ui.context.moveTo(0, y * Game.engine.map.tileSize);
        Game.engine.ui.context.lineTo(Game.engine.map.h * Game.engine.map.tileSize, y * Game.engine.map.tileSize);
        Game.engine.ui.context.strokeStyle = "gray";
        Game.engine.ui.context.stroke();
    }
}

function renderTiles() {
    for (var i = 0; i < Game.engine.map.tiles.length; i++) {
        Game.engine.ui.context.beginPath();
        Game.engine.ui.context.rect(Game.engine.map.tiles[i].x * Game.engine.map.tileSize, Game.engine.map.tiles[i].y * Game.engine.map.tileSize, Game.engine.map.tileSize, Game.engine.map.tileSize);
        var type = Game.engine.map.tiles[i].type;
        var color;
        switch (type) {
        case "grass":
            color = "lightgray";
            break;
        case "water":
            color = "#393939";
            break;
        case "mountain":
            color = "dimgray";
            break;
        }
        Game.engine.ui.context.fillStyle = color
        Game.engine.ui.context.fill();

    }
}

function renderGoods() {
    for (var i = 0; i < goods.length; i++) {
        goods[i].move();
        renderCircle(goods[i]);
        smallDisplays[1].innerHTML = "" + goods[i].name + "";
    }
}

function renderEverything() {
    clearScreen();
    renderTiles();
    renderGrid();
    Game.engine.ui.render();
    var connectionWindow = "<table id='Game.engine.connections'><thead><tr><th class='connection' onClick='Game.engine.connections.sortByProp(\"name\");'>Connection</th><th class='length' onClick='Game.engine.connections.sortByProp(\"length\");'>Length (cu)</th><th class='value' onClick='Game.engine.connections.sortByProp(\"value\");'>Value (cm)</th><th colspan='2' class='options'>Options</th></tr></thead>";
    for (var i = 0; i < Game.engine.connections.length; i++) {
        var c = Game.engine.connections[i];
        if (c.market.clock.tickedByThisMuch(c.market.volatility * 2)) c.market.change();
        if (c.clock.ticked()) c.evaluate();
        var id = Game.engine.connections[i].name;
        renderLine(Game.engine.connections[i]);
        connectionWindow += "<tr id='" + id + "' onMouseOver='Game.engine.selDestByConn(this,true)' onMouseOut='Game.engine.selDestByConn(this,false)'><td>" + Game.engine.connections[i].name + "</td><td>" + Game.engine.connections[i].length + "</td><td>" + Game.engine.connections[i].value + " (+" + Game.engine.connections[i].lastGoodValue + ") " + Game.engine.connections[i].market.mood + "</td><td><input type='button' class='button' value='info' id='" + id + "' onClick='displayConnection(this); Game.engine.ui.displayDialog(\"hey\");'/></td><td><input type='button' class='button'  value='scrap' id='" + id + "' onClick='deleteConnection(this)'/></td>";
    }
    connectionWindow += "<tfoot><th class='connection' onClick='Game.engine.connections.sortByProp(\"name\");'>Connection</th><th class='length' onClick='Game.engine.connections.sortByProp(\"length\");'>Length (cu)</th><th class='value' onClick='Game.engine.connections.sortByProp(\"value\");'>Value (cm)</th><th colspan='2' class='options'>Options</th></tr></table>";
    var destinationWindow = "<table id='Game.engine.destinations'><thead><tr><th class='destination' onClick='Game.engine.destinations.sortByProp(\"name\");'>Municipality</td><th class='population' onClock='Game.engine.destinations.sortByProp(\"population.value\");'>Citizens</th><th class='value' onClick='Game.engine.destinations.sortByProp(\"market.value\");'>Value</th><th colspan='2' class='options'>Options</th></tr></thead>";
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
        renderDestination(d);
        destinationWindow += "<tr><td>" + d.name + "</td><td>" + d.population.value + "</td><td>" + d.market.value + "</td><td><input type='button' class='button' value='info'/></td>";
    }
    destinationWindow += "<tfoot><tr><th class='destination' onClick='Game.engine.destinations.sortByProp(\"name\");'>Municipality</td><th class='population' onClock='Game.engine.destinations.sortByProp(\"population.value\");'>Citizens</th><th class='value' onClick='Game.engine.destinations.sortByProp(\"market.value\");'>Value</th><th colspan='2' class='options'>Options</th></tr></tfoot></table>";
    if (Game.engine.ui.smallDisplays[1].innerHTML != destinationWindow) {
        Game.engine.ui.smallDisplays[1].innerHTML = destinationWindow;
    }
    if (Game.engine.ui.displayContent != connectionWindow) {
        Game.engine.ui.display.innerHTML = connectionWindow;
        Game.engine.ui.displayContent = connectionWindow;
    }
    var targetWindow = "";
    for (var i = 0; i < Game.engine.destinations.length; i++) {
        if (Game.engine.destinations[i] == Game.engine.mouse.currentTarget) {
            var d = Game.engine.destinations[i];
            targetWindow += "<table>";
            targetWindow += "<thead><th colspan=2><h2 class='underlined'>" + d.name + "</h2></th></thead>";
            targetWindow += "<tr><td colspan=2><h3 class='subtitle'>A " + d.description + " " + d.population.description + " in Crudbury</h3></td></tr>";
            targetWindow += "<tr><td colspan=2>it is surrounded by " + d.geography.description + " " + d.geography.type + "</td></tr>";
            targetWindow += "<tr><td colspan=2><h3>the populace is " + d.market.volatilityDescription + "</h3></td></tr>";
            targetWindow += "<tr><td colspan=2>they are pleased to produce " + d.factory.product + " for Crudbury</td></tr>";
            targetWindow += "<tr><td>citizens existing:</td><td>" + d.population.value + "</td></tr>";
            targetWindow += "<tr><td>connections (total value):</td><td>" + d.market.connections.length + " (" + d.market.value + ")</td></tr>";
            targetWindow += "</table>";
        }
    }
    Game.engine.ui.smallDisplays[0].innerHTML = targetWindow;
    for (var i = 0; i < Game.engine.connections.length; i++) {
        for (var g = 0; g < Game.engine.connections[i].goods.length; g++) {
            Game.engine.connections[i].goods[g].move(Game.engine.connections[i].speed);
        }
    }
    for (var i = 0; i < Game.engine.connections.length; i++) {
        for (var g = 0; g < Game.engine.connections[i].goods.length; g++) {
            renderGood(Game.engine.connections[i].goods[g]);
        }
    }
    Game.engine.effects.process();
}