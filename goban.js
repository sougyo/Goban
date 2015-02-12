var StoneType = {
  NONE: 0,
  BLACK: 1,
  WHITE: 2,
  reverse: function(stone) {
    if (stone == this.BLACK) return this.WHITE;
    if (stone == this.WHITE) return this.BLACK;
    return;
  },
  exists: function(stone) {
    return stone == this.BLACK || stone == this.WHITE;
  }
};

var Board = function(size) {
  this.size = size;
  this.board = new Array(size);
  for (var x = 0; x < this.size; x++)
    this.board[x] = new Array(size);

  this.set = function(x, y, stone) {
    if (this.isOutOfRange(x, y))
      return;
    this.board[x][y] = stone;
  }

  this.get = function(x, y) {
    if (this.isOutOfRange(x, y))
      return;
    return this.board[x][y];
  }

  this.copyFrom = function(other) {
    if (this.size != other.size)
      return;
    for (var x = 0; x < this.size; x++)
      for (var y = 0; y < this.size; y++)
        this.board[x][y] = other.get(x, y);
  }

  this.count = function(stone) {
    var c = 0;
    for (var x = 0; x < this.size; x++)
      for (var y = 0; y < this.size; y++)
        if (this.board[x][y] == stone) c++;
    return c;
  }

  this.clear = function() {
    for (var x = 0; x < this.size; x++)
      for (var y = 0; y < this.size; y++)
        this.board[x][y] = StoneType.NONE;
  }

  this.isOutOfRange = function(x, y) {
    return x < 0 || this.size <= x || y < 0 || this.size <= y;
  }

  this.clear();
}

var DrawerEnv = function(size, ctx) {
  if (!ctx)
    return;

  this.size = size;
  this.ctx = ctx;

  this.paddingTop    = 10;
  this.paddingBottom = 50;
  this.paddingLeft   = 20;
  this.paddingRight  = 20;

  this.resize = function(width, height) {
    this.canvasWidth  = width;
    this.canvasHeight = height;

    this.boardAreaWidth  = this.canvasWidth  - this.paddingLeft - this.paddingRight;
    this.boardAreaHeight = this.canvasHeight - this.paddingTop  - this.paddingBottom;
    this.hgrid = Math.floor(Math.min(this.boardAreaWidth, this.boardAreaHeight) / (2 * this.size));
    this.grid  = this.hgrid * 2;
    this.boardSize = this.grid * this.size;

    this.xOffset = (this.boardAreaWidth  - this.boardSize) / 2 + this.paddingLeft;
    this.yOffset = (this.boardAreaHeight - this.boardSize) / 2 + this.paddingTop;

    this.ctx.canvas.width  = this.canvasWidth;
    this.ctx.canvas.height = this.canvasHeight;
  }

  this.toX = function(x) {
    return this.grid * x + this.hgrid + this.xOffset;
  }

  this.toY = function(y) {
    return this.grid * y + this.hgrid + this.yOffset;
  }

  this.drawBoardCircle = function(x, y, r, fill, dx, dy) {
    dx = dx ? dx : 0;
    dy = dy ? dy : 0;
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(this.toX(x) + dx, this.toY(y) + dy, r, 0, Math.PI*2, false);
    if (fill)
      ctx.fill();
    else
      ctx.stroke();
  }

  this.drawBoardLine = function(x1, y1, x2, y2) {
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(this.toX(x1), this.toY(y1));
    ctx.lineTo(this.toX(x2), this.toY(y2));
    ctx.stroke();
  }

  this.drawImage = function(image, x, y, size) {
    var ctx = this.ctx;
    var dx = this.toX(x) - size / 2;
    var dy = this.toY(y) - size / 2;
    try {
      ctx.drawImage(image, dx, dy, size, size);
    } catch (e) {
      if (e.name != "NS_ERROR_NOT_AVAILABLE")
        throw e;
    }
  }
}

var GoDrawer = function(player, canvasid) {
  this.canvas = document.getElementById(canvasid);
  if (!this.canvas || !this.canvas.getContext)
    return;
  this.player = player;
  this.tree = player.sgfTree;
  this.env = new DrawerEnv(this.player.size, this.canvas.getContext('2d'));
  if (!this.env)
    return;

  var drawer = this;
  this.createImage = function(path) {
    var img = new Image();
    img.src = path;
    img.onload = function() {
      drawer.draw();
    }
    return img;
  }

  this.blackImg = this.createImage("images/black.png");
  this.whiteImg = this.createImage("images/white.png");
  this.woodImg  = this.createImage("images/wood.png");

  this.resize = function() {
    this.env.resize($(this.canvas).width(), $(this.canvas).height());
    this.draw();
  }

  this.drawBackground = function(env) {
    //env.ctx.fillStyle = 'rgb(210, 180, 140)';
    env.ctx.fillStyle = 'rgb(252, 247, 242)';
    env.ctx.fillRect(0, 0, env.canvasWidth, env.canvasHeight);
    env.ctx.drawImage(drawer.woodImg, env.xOffset, env.yOffset, env.boardSize, env.boardSize);
  }

  this.drawBoard = function(env) {
    var size = env.size;
    env.ctx.lineWidth = 1;
    env.ctx.strokeStyle = 'rgb(30, 30, 30)';
    for (var i = 0; i < size; i++) {
      env.drawBoardLine(0, i, size - 1, i);
      env.drawBoardLine(i, 0, i, size - 1);
    }
  }

  this.drawPoint = function(env) {
    var size = env.size;
    var lpos = 3;
    var rpos = size - lpos - 1;
    var hpos = Math.floor(size / 2);

    var points = [];
    if (size > 10) {
      points.push([lpos, lpos]);
      points.push([rpos, lpos]);
      points.push([lpos, rpos]);
      points.push([rpos, rpos]);
    }
    if ((size % 2 == 1) && size >= 19) {
      points.push([hpos, hpos]);
      points.push([lpos, hpos]);
      points.push([hpos, lpos]);
      points.push([rpos, hpos]);
      points.push([hpos, rpos]);
    }

    var pointSize = env.hgrid / 4;
    env.ctx.fillStyle = 'black';
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      env.drawBoardCircle(p[0], p[1], pointSize, true);
    }
  }

  this.drawChildren = function(env) {
    var nodes = this.tree.current.children;
    if (nodes.length < 2)
      return;
    var pointSize = env.hgrid / 2;
    env.ctx.fillStyle = 'pink';
    var stone = this.player.rule.nextStone;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var move = this.player.propUtil.getMoveFrom(node);
      if (move.stone == stone)
        env.drawBoardCircle(move.x, move.y, pointSize, true);
    }
  }

  this.drawShadow = function(env) {
    var size = env.size;
    var offset = env.hgrid / 6;
    var shadowSize = env.hgrid * 0.9;
    var ctx = env.ctx;

    var save = ctx.globalAlpha;
    ctx.fillStyle = 'black';
    ctx.globalAlpha = 0.2;
    for (var x = 0; x < size; x++)
      for (var y = 0; y < size; y++)
        if (StoneType.exists(this.player.getStone(x, y)))
          env.drawBoardCircle(x, y, shadowSize, true, -offset, offset);

    ctx.globalAlpha = save;
  }

  this.drawStone = function(env) {
    var size = env.size;
    var stoneSize = env.hgrid - 1;
    var ctx = env.ctx;
    for (var x = 0; x < size; x++) {
      for (var y = 0; y < size; y++) {
        var stone = this.player.getStone(x, y);
        if (StoneType.exists(stone)) {
          color = stone == StoneType.BLACK ? 'black' : 'rgb(210, 210, 210)';
          ctx.fillStyle = color;
          ctx.strokeStyle = 'rgb(0, 0, 0)';
          ctx.lineWidth = 2;
          env.drawBoardCircle(x, y, stoneSize, true);
        }
      }
    }
  }

  this.drawStoneImage = function(env) {
    var size = env.size;

    for (var x = 0; x < size; x++) {
      for (var y = 0; y < size; y++) {
        var stone = this.player.getStone(x, y);
        if (StoneType.exists(stone)) {
          var img = stone == StoneType.BLACK ? this.blackImg : this.whiteImg;
          env.drawImage(img, x, y, env.grid - 2);
        }
      }
    }
  }

  this.drawHama = function(env) {
    if (env.paddingBottom < 20)
      return;
    var ctx = env.ctx;
    var y = env.paddingTop + env.boardAreaHeight + 25;
    var basex = env.xOffset + 5;
    ctx.fillStyle = "black";
    ctx.font = "14pt Arial";
    ctx.fillText("Cnt: "   + this.player.rule.cnt, basex + 0, y);
    ctx.fillText("Black: " + this.player.rule.getBlackHama(), basex + 80, y);
    ctx.fillText("White: " + this.player.rule.getWhiteHama(), basex + 160, y);
  }

  this.draw = function() {
    var env = this.env;
    this.drawBackground(env);

    this.drawBoard(env);
    this.drawPoint(env);
    this.drawShadow(env);
    this.drawStone(env);
    this.drawStoneImage(env);
    this.drawHama(env);
    this.drawChildren(env);
  }


  this.resize();

  var env = this.env;
  this.handleMouseEvent = function(e) {
    if (this.clickEventListener) {
      var grid = env.grid;
      var rect = e.target.getBoundingClientRect();
      var x = e.clientX - rect.left - env.xOffset;
      var y = e.clientY - rect.top  - env.yOffset;
      var x = Math.floor(x / grid);
      var y = Math.floor(y / grid);
      this.clickEventListener(x, y);
    }
  }
  this.canvas.addEventListener("click", function(e) {
    var upX = e.clientX;
    var upY = e.clientY;
    var downX = env.downX;
    var downY = env.downY;
    if (Math.sqrt(Math.pow((upX - downX), 2) + Math.pow((upY - downY), 2) < env.hgrid)) {
      drawer.handleMouseEvent(e);
    }
  });
  this.canvas.addEventListener("mousedown", function(e) {
    env.downX = e.clientX;
    env.downY = e.clientY;
  });
}

var ScanTable = function(size) {
  this.size = size;
  this.table = new Array(this.size);
  this.enabled = true;

  for (var x = 0; x < this.size; x++) {
    this.table[x] = new Array(this.size);
  }

  this.mark = function(x, y) {
    this.table[x][y] = true;
  }

  this.isMarked = function(x, y) {
    return this.table[x][y];
  }

  this.disableScan = function() {
    this.enabled = false;
  }

  this.isEnabled = function() {
    return this.enabled;
  }

  this.merge = function(other) {
    if (!other.isEnabled())
      return;
    if (this.size != other.size)
      return;
    for (var x = 0; x < this.size; x++)
      for (var y = 0; y < this.size; y++)
        this.table[x][y] = this.table[x][y] || other.table[x][y];
  }

  this.count = function() {
    var c = 0;
    for (var x = 0; x < this.size; x++)
      for (var y = 0; y < this.size; y++)
        if (this.table[x][y]) c++;
    return c;
  }

  this.clear = function() {
    for (var x = 0; x < this.size; x++)
      for (var y = 0; y < this.size; y++)
        this.table[x][y] = false;
    this.enabled = true;
  }

  this.clear();
}

var Scanner = function(size) {
  this.size = size;
  this.scanTable = new ScanTable(size);
  this.scan = function(x, y, board, scanableStone, abortStone) {
    if (board.size != this.size)
      return;
    
    this.scanTable.clear();
    this.board = board;
    this.scanableStone = scanableStone;
    this.abortStone = abortStone;
    this.scanRecursively(x, y);
    return this.scanTable;
  }

  this.scanRecursively = function(x, y) {
    if (this.board.isOutOfRange(x, y))
      return;
    if (this.scanTable.isMarked(x, y))
      return;
    if (this.board.get(x, y) == this.abortStone)
      this.scanTable.disableScan();
    if (this.board.get(x, y) != this.scanableStone)
      return;
    this.scanTable.mark(x, y);

    this.scanRecursively(x + 1, y);
    this.scanRecursively(x - 1, y);
    this.scanRecursively(x, y - 1);
    this.scanRecursively(x, y + 1);
  }
}

var IgoRuleEngine = function(size) {
  this.size = size;
  this.scanner = new Scanner(size);
  this.removeTable = new ScanTable(size);
  this.board = new Board(size);
  this.tmpBoard = new Board(size);

  this.resetKo = function() {
    this.koX = null;
    this.koY = null;
  }

  this.clear = function() {
    this.nextStone = StoneType.BLACK;
    this.cnt = 0;
    this.hama = {}
    this.hama[StoneType.BLACK] = 0;
    this.hama[StoneType.WHITE] = 0;
    this.resetKo();
    this.board.clear();
  }
  this.clear();

  this.pass = function() {
    this.nextStone = StoneType.reverse(this.nextStone);
    this.cnt += 1;
    this.resetKo();
  }

  this.setNextStone = function(stone) {
    if (StoneType.exists(stone) && stone != this.nextStone) {
      this.resetKo();
      this.nextStone = stone;
    }
  }

  this.setStone = function(x, y, stone) {
    if (this.board.isOutOfRange(x, y))
      return;
    this.board.set(x, y, stone);
    this.resetKo();
    return true;
  }

  this.putStone = function(x, y) {
    var stone = this.nextStone;
    var revStone = StoneType.reverse(stone);

    if (this.board.isOutOfRange(x, y))
      return;
    if (this.board.get(x, y) != StoneType.NONE)
      return;

    this.tmpBoard.copyFrom(this.board);
    this.tmpBoard.set(x, y, stone);

    this.removeTable.clear();
    this.mergeRemoveTable(x - 1, y, revStone);
    this.mergeRemoveTable(x + 1, y, revStone);
    this.mergeRemoveTable(x, y - 1, revStone);
    this.mergeRemoveTable(x, y + 1, revStone);

    if (x == this.koX && y == this.koY && this.removeTable.count() == 1)
      return;
    this.removeStones(this.removeTable);

    if (this.scanner.scan(x, y, this.tmpBoard, stone, StoneType.NONE).isEnabled())
      return;

    this.board.copyFrom(this.tmpBoard);
    this.updateKo();
    this.hama[stone] += this.removeTable.count();
    this.nextStone = revStone;
    this.cnt += 1;
    return true;
  }

  this.mergeRemoveTable = function(x, y, stone) {
    this.removeTable.merge(this.scanner.scan(x, y, this.tmpBoard, stone, StoneType.NONE)); 
  }

  this.getTerritory = function(stone) {
    var revStone = StoneType.reverse(stone);
    var result = new ScanTable(this.size);

    if (this.board.count(StoneType.BLACK) == 0 &&
        this.board.count(StoneType.WHITE) == 0)
      return result;

    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        if (result.isMarked(x, y))
          continue;
        var tmp = this.scanner.scan(x, y, this.board, StoneType.NONE, revStone);
        if (tmp.isEnabled())
          result.merge(tmp);
      }
    }
    return result;
  }

  this.getScore = function(stone) {
    return this.getTerritory(stone).count() + this.hama[stone];
  }

  this.removeStones = function(scannedTable) {
    var sum = 0;
    for (var x = 0; x < this.size; x++)
      for (var y = 0; y < this.size; y++)
        if (scannedTable.isMarked(x, y)) {
          if (this.tmpBoard.get(x, y) != StoneType.NONE)
            sum++;
          this.tmpBoard.set(x, y, StoneType.NONE);
        }
  }
 
  this.updateKo = function() {
    this.resetKo();
    if (this.removeTable.count() != 1)
      return;
    for (var x = 0; x < this.size; x++)
      for (var y = 0; y < this.size; y++)
        if (this.removeTable.isMarked(x, y)) {
          this.koX = x;
          this.koY = y;
          return;
        }
  }

  this.getBlackHama = function() {
    return this.hama[StoneType.BLACK];
  }

  this.getWhiteHama = function() {
    return this.hama[StoneType.WHITE];
  }
}

var SgfReader = function() {
  this.LeftParenthes  = 1;
  this.RightParenthes = 2;
  this.Semicolon      = 3;
  this.UcWord         = 4;
  this.BracketBlock   = 5;

  this.Token = function(type, data) {
    this.type = type;
    this.data = data;
  }

  this.readSgf = function(str) {
    this.rest = str;
    var tree = new SgfTree();

    readSgfTree(tree.root);
  }

  this.consumeToken = function(type) {
    var token = nextToken();
    if (token.type != type)
      throw new Error("consume error");
  }

  this.readSgfTree = function(parentNode) {
    this.consumeToken(this.LeftParenthes);

    var lastNode = readNodeSequence(parentNode);
    while (child = readSgfTree(node))
      lastNode.addChild(child);

    this.consumeToken(this.RightParenthes);
  }

  this.readNodeSequence = function(parentNode) {
    var node;
    while(node = readNode(parentNode))
      parentNode = node;
    return parentNode;
  }

  this.readTokenByType = function(type) {
    token = this.nextToken();
    if (token.type == type)
      return token.data;
    this.push(token);
    return;
  }

  this.readNode = function(parentNode) {
    var node = new SgfNode(parentNode);
    this.consumeToken(this.Semicolon);

    while (ident = readTokenByType(this.UcWord)) {
      var blocks = [];
      while(block = readTokenByType(this.BracketBlock))
        blocks << block;

      node.setProperty(ident, blocks);
    }
    return node;
  }

  this.headToken = null;
  this.push = function(token) {
    this.headToken = token;
  }

  this.nextToken = function() {
    if (this.headToken) {
      var token = this.headToken;
      this.headToken = null;
      return token;
    }

    var str = this.rest;
    str = this.skipSpace(str);
    
    switch (str[0]) {
      case '(': return new Token(this.LeftParenthes, null);
      case ')': return new Token(this.RightParenthes, null);
      case ';': return new Token(this.Semicolon, null);
      case '[': return;
      default: return;

    }
  }

  this.skipSpace = function(str) {
    start = str.match(/[^\s]/);
    return (start == -1) ? "" : str.substr(start);
  }
}

var SgfNode = function(parentNode) {
  this.properties = {};

  this.parentNode = parentNode;
  this.children = [];
  this.childIndex = 0;

  this.setProperty = function(propIdent, propValue) {
    this.properties[propIdent] = propValue;
  }

  this.getProperty = function(propIdent) {
    return this.properties[propIdent];
  }

  this.hasProperty = function(propIdent) {
    return this.properties.hasOwnProperty(propIdent);
  }

  this.removeProperty = function(propIdent) {
    delete this.properties[propIdent];
  }

  this.copy = function(parentNode) {
    var result = new SgfNode(parentNode);
    for (var ident in this.properties) {
      var prop = this.properties[ident];
      result.properties[ident] = prop.hasOwnProperty("copy") ?
                                   prop.copy() :
                                   JSON.parse(JSON.stringify(prop));
    }
    for (var i = 0; i < this.children.length; i++)
      result.addChild(this.children[i].copy(result));
    result.setChildIndex(this.childIndex);
    return result;
  }

  this.addChild = function(child) {
    this.children.push(child);
    this.childIndex = this.children.length - 1;
  }

  this.removeChild = function() {
    this.children.splice(this.childIndex, 1);
    this.childIndex = 0;
  }

  this.hasChild = function() {
    return this.children.length > 0;
  }

  this.setChildIndex = function(i) {
    if (0 <= i && i < this.children.length) {
      this.childIndex = i;
      return true;
    }
  }

  this.getChild = function() {
    if (this.hasChild())
      return this.children[this.childIndex];
  }

  this.setChild = function(child) {
    this.children[this.childIndex] = child;
  }

  // helper function for toString
  var propValue2str = function(propValue) {
    if (!propValue)
      return "";

    if (!isArray(propValue))
      propValue = [propValue];

    var result = "";
    for (var i = 0; i < propValue.length; i++)
      result += "[" + propValue[i].toString() + "]";
    return result;
  }

  this.toString = function() {
    var result = ";";
    for (ident in this.properties) {
      result += ident;
      result += propValue2str(this.properties[ident]);
    }
    return result;
  }
}

var SgfTree = function() {
  this.root = new SgfNode(null);
  this.current = this.root;

  this.newChild = function() {
    this.current.addChild(new SgfNode(this.current));
    this.current = this.current.getChild();
  }

  this.insertNewNode = function() {
    var cur = this.current;

    if (cur.hasChild()) {
      var node = new SgfNode(cur);
      node.addChild(cur.getChild());
      cur.setChild(node);
      cur.getChild().parentNode = node;
      this.current = this.current.getChild();
    } else {
      this.newChild();
    }
  }

  this.forward = function() {
    if (this.current.hasChild()) {
      this.current = this.current.getChild();
      return true;
    }
  }

  this.forwardTo = function(index) {
    if (this.current.setChildIndex(index)) {
      this.current = this.current.getChild();
      return true;
    }
  }

  this.back = function() {
    if (this.current != this.root) {
      this.current = this.current.parentNode;
      return true;
    }
  }

  this.cut = function() {
    if (this.current != this.root) {
      this.current = this.current.parentNode;
      this.current.removeChild();
      return true;
    }
  }

  this.toSequence = function() {
    var nodes = [];
    for (var cur = this.current; cur != this.root; cur = cur.parentNode)
      nodes.unshift(cur);
    return nodes;
  }

  this.copy = function() {
    var tree = new SgfTree();
    tree.root = this.root.copy(null);

    var cur1 = this.root;
    var cur2 = tree.root;
    while (cur1) {
      if (cur1 === this.current) {
        tree.current = cur2;
        break;
      }
      cur1 = cur1.getChild();
      cur2 = cur2.getChild();
    }
    return tree;
  }

  this.toString = function() {
    var result = "";
    var nodes = this.toSequence();
    for (var i = 0; i < nodes.length; i++)
      result += nodes[i].toString();
    return result;
  }
}

var isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

var Move = function(x, y, stone) {
  this.x = x;
  this.y = y;
  this.stone = stone;
}

var IgoPoint = function(x, y) {
  this.x = x;
  this.y = y;

  this.toString = function() {
    if (this.x >= 0 && this.y >= 0) {
      var strX = this.toChar(this.x);
      var strY = this.toChar(this.y);
      if (strX && strY)
        return strX + strY;
    }
    return ""
  }

  this.toChar = function(x) {
    if (0 <= x && x < 26)
      return String.fromCharCode("a".charCodeAt() + x);
    else if (26 <= x && x < 52)
      return String.fromCharCode("A".charCodeAt() + x - 26);
  }

  this.copy = function() {
    return new IgoPoint(this.x, this.y);
  }
}

var PropUtil = function(tree) {
  this.tree = tree;

  var StonePropBase = function(dict) {
    this.dict = dict;
    this.stone2ident = function(stone) {
      for (var i = 0; i < this.dict.length; i++)
        if (this.dict[i][1] == stone)
          return this.dict[i][0];
    }

    this.ident2stone = function(ident) {
      for (var i = 0; i < this.dict.length; i++)
        if (this.dict[i][0] == ident)
          return this.dict[i][1];
    }

    this.length = function() {
      return this.dict.length;
    }

    this.identAt = function(index) {
      return this.dict[index][0];
    }

    this.stoneAt = function(index) {
      return this.dict[index][1];
    }

    this.existsIn = function(node) {
      for (var i = 0; i < this.dict.length; i++) {
        if (node.hasProperty(this.identAt(i)))
          return true;
      }
      return false;
    }
  }
  
  this.moveProp = new StonePropBase([
      ["B",  StoneType.BLACK],
      ["W",  StoneType.WHITE]
  ]);

  this.setupProp = new StonePropBase([
      ["AB", StoneType.BLACK],
      ["AW", StoneType.WHITE],
      ["AE", StoneType.NONE ]
  ]);

  this.moveProp.findChildIndexFrom = function(node, x, y, stone) {
    for (var i = 0; i < node.children.length; i++) {
      var child = node.children[i];
      var val = child.getProperty(this.stone2ident(stone));
      if (val && val.x == x && val.y == y)
        return i;
    }
    return null;
  }

  this.moveProp.getMoveFrom = function(node) {
    for (var i = 0; i < this.length(); i++) {
      var p = node.getProperty(this.identAt(i));
      if (p)
        return new Move(p.x, p.y, this.stoneAt(i));
    }
  }

  this.setupProp.removeMatchedPointFrom = function(node, x, y) {
    for (var i = 0; i < this.length(); i++) {
      var ident = this.identAt(i);
      var propVal = node.getProperty(ident);
      if (!propVal)
        continue;
      for (var j = 0; j < propVal.length; j++) {
        var p = propVal[j];
        if (p.x == x && p.y == y) {
          propVal.splice(j, 1);
          break;
        }
      }
      if (propVal.length == 0)
        node.removeProperty(ident);
    }
  }

  this.setupProp.getMovesFrom = function(node) {
    var result = [];
    for (var i = 0; i < this.length(); i++) {
      var propVal = node.getProperty(this.identAt(i));
      if (!propVal)
        continue;
      for (var j = 0; j < propVal.length; j++) {
        var p = propVal[j];
        result.push(new Move(p.x, p.y, this.stoneAt(i)));
      }
    }
    return result;
  }


  this.addMoveProperty = function(x, y, stone) {
    var childIndex = this.moveProp.findChildIndexFrom(this.currentNode(), x, y, stone);

    if (childIndex == null) {
      var propIdent = this.moveProp.stone2ident(stone);
      if (propIdent) {
        this.tree.newChild();
        this.currentNode().setProperty(propIdent, new IgoPoint(x, y));
      }
    } else {
      this.tree.forwardTo(childIndex);
    }
  }

  this.addSetupProperty = function(x, y, stone) {
    if (!this.setupProp.existsIn(this.currentNode()))
      this.tree.insertNewNode();

    var propIdent = this.setupProp.stone2ident(stone);
    if (propIdent) {
      var node = this.currentNode();
      this.setupProp.removeMatchedPointFrom(node, x, y);
      var propValue = node.getProperty(propIdent);
      if (propValue)
        propValue.push(new IgoPoint(x, y));
      else
        node.setProperty(propIdent, [new IgoPoint(x, y)]);
    }
  }

  this.getMoveFrom = function(node) {
    return this.moveProp.getMoveFrom(node);
  }

  this.getSetupMovesFrom = function(node) {
    return this.setupProp.getMovesFrom(node);
  }

  this.currentNode = function() {
    return this.tree.current;
  }
}

var IgoPlayer = function(size, sgfTree) {
  this.size = size;
  this.rule = new IgoRuleEngine(size);
  this.listeners = [];

  this.sgfTree = sgfTree ? sgfTree : new SgfTree();
  this.propUtil = new PropUtil(this.sgfTree);
  
  this.putStone = function(x, y) {
    var stone = this.rule.nextStone;
    if (this.rule.putStone(x, y)) {
      this.propUtil.addMoveProperty(x, y, stone);
      this.notify();
    }
  }

  this.setStone = function(x, y, stone) {
    if (this.rule.setStone(x, y, stone)) {
      this.propUtil.addSetupProperty(x, y, stone);
      this.notify();
    }
  }

  this.getStone = function(x, y) {
    return this.rule.board.get(x, y);
  }

  this.updateGoban = function() {
    this.rule.clear();
    var nodes = this.sgfTree.toSequence();
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var move = this.propUtil.getMoveFrom(node);
      if (move) {
        this.rule.setNextStone(move.stone);
        this.rule.putStone(move.x, move.y);
      }
      var moves = this.propUtil.getSetupMovesFrom(node);
      if (moves) {
        for (var j = 0; j < moves.length; j++) {
          var move = moves[j];
          this.rule.setStone(move.x, move.y, move.stone);
        }
      }
    }
    this.notify();
  }

  this.back = function() {
    if (this.sgfTree.back())
      this.updateGoban();
  }

  this.forward = function() {
    if (this.sgfTree.forward())
      this.updateGoban();
  }

  this.cut = function() {
    if (this.sgfTree.cut())
      this.updateGoban();
  }

  this.isLeaf = function() {
    return !this.moveTree.current.hasChild();
  }

  this.pass = function() {
    var stone = this.rule.nextStone;
    this.rule.pass();
    this.propUtil.addMoveProperty(-1, -1, stone);
    this.notify();
  }

  this.addListener = function(listener) {
    this.listeners.push(listener);
  }

  this.notify = function() {
    for (var i = 0; i < this.listeners.length; i++)
      this.listeners[i]();
  }

  this.copy = function() {
    var player = new IgoPlayer(this.size, this.sgfTree.copy());
    player.updateGoban();
    return player;
  }
}

var createDrawer = function(player, id) {
  var drawer = new GoDrawer(player, id);

  player.addListener(function() {
    drawer.draw();
  });
  drawer.clickEventListener = function(x, y) {
    player.putStone(x, y);
  }
  return drawer;
}

if (typeof(module) != "undefined") {
  module.exports = {
   SgfTree:   SgfTree,
   Move:      Move,
   StoneType: StoneType,
   SgfNode:   SgfNode,
   IgoPlayer: IgoPlayer,
   IgoPoint:  IgoPoint,
  }
}

