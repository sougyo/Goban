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
  for (var x = 0; x < this.size; x++) {
    this.board[x] = new Array(size);
  }

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
    return this.grid * x + this.hgrid;
  }

  this.toY = function(y) {
    return this.grid * y + this.hgrid;
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
    ctx.drawImage(image, dx, dy, size, size);
  }

}

var GoDrawer = function(goban, canvasid, tree) {
  this.canvas = document.getElementById(canvasid);
  if ( ! this.canvas || ! this.canvas.getContext ) {
    return;
  }

  this.tree = tree; //should be removed later
  this.goban = goban;
  this.env = new DrawerEnv(this.goban.size, this.canvas.getContext('2d'));

  this.blackImg = new Image();
  this.blackImg.src = "../images/black.png";
  this.whiteImg = new Image();
  this.whiteImg.src = "../images/white.png";
  this.woodImg = new Image();
  this.woodImg.src = "../images/wood.png";

  var drawer = this;
  this.woodImg.onload = function() {
    drawer.draw();
  }

  this.resize = function() {
    this.env.resize($(this.canvas).width(), $(this.canvas).height());
    this.draw();
  }

  this.drawBackground = function(env) {
    env.ctx.fillStyle = 'rgb(210, 180, 140)';
    //env.ctx.fillStyle = 'rgb(189, 183, 107)';
    env.ctx.fillRect(0, 0, env.canvasWidth, env.canvasHeight);

    var drawFunc = function() {
      try {
        env.ctx.drawImage(drawer.woodImg, env.xOffset, env.yOffset, env.boardSize, env.boardSize);
      } catch (e) {
        if (e.name != "NS_ERROR_NOT_AVAILABLE")
          throw e;
      }
    }
    drawFunc();
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
    for (var i = 0; i < nodes.length; i++) {
      var move = nodes[i].move;
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
    for (var x = 0; x < size; x++) {
      for (var y = 0; y < size; y++) {
        if (StoneType.exists(this.goban.getStone(x, y))) {
          env.drawBoardCircle(x, y, shadowSize, true, -offset, offset);
        }
      }
    }
    ctx.globalAlpha = save;
  }

  this.drawStone = function(env) {
    var size = env.size;
    var stoneSize = env.hgrid - 1;
    var ctx = env.ctx;
    for (var x = 0; x < size; x++) {
      for (var y = 0; y < size; y++) {
        var stone = this.goban.getStone(x, y);
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
        var stone = this.goban.getStone(x, y);
        if (StoneType.exists(stone)) {
          var img = stone == StoneType.BLACK ? this.blackImg : this.whiteImg;
          env.drawImage(img, x, y, env.grid - 2);
        }
      }
    }
  }

  this.drawHama = function(env) {
    if (env.paddingBottom < 10)
      return;
    var ctx = env.ctx;
    var y = env.paddingTop + env.boardAreaHeight + 5;
    ctx.fillStyle = "black";
    ctx.font = "14pt Arial";
    ctx.fillText("Cnt: "   + this.goban.rule.cnt, 20, y);
    ctx.fillText("Black: " + this.goban.rule.getBlackHama(), 100, y);
    ctx.fillText("White: " + this.goban.rule.getWhiteHama(), 200, y);
  }

  this.draw = function() {
    var env = this.env;
    this.drawBackground(env);

    env.ctx.save();
    env.ctx.translate(env.xOffset, env.yOffset);
    this.drawBoard(env);
    this.drawPoint(env);
    this.drawShadow(env);
    this.drawStone(env);
    this.drawStoneImage(env);
    this.drawHama(env);
    this.drawChildren(env);
    env.ctx.restore();
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
    this._scan(x, y);
    return this.scanTable;
  }

  this._scan = function(x, y) {
    if (this.board.isOutOfRange(x, y))
      return;
    if (this.scanTable.isMarked(x, y))
      return;
    if (this.board.get(x, y) == this.abortStone)
      this.scanTable.disableScan();
    if (this.board.get(x, y) != this.scanableStone)
      return;
    this.scanTable.mark(x, y);

    this._scan(x + 1, y);
    this._scan(x - 1, y);
    this._scan(x, y - 1);
    this._scan(x, y + 1);
  }
}

var IgoRuleEngine = function(size) {
  this.size = size;
  this.scanner = new Scanner(size);
  this.removeTable = new ScanTable(size);
  this.board = new Board(size);
  this.tmpBoard = new Board(size);

  this.clear = function() {
    this.nextStone = StoneType.BLACK;
    this.cnt = 0;
    this.koX = null;
    this.koY = null;
    this.hama = {}
    this.hama[StoneType.BLACK] = 0;
    this.hama[StoneType.WHITE] = 0;
    this.board.clear();
  }
  this.clear();

  this.changeStone = function() {
    this.koX = null;
    this.koY = null;
    this.nextStone = StoneType.reverse(this.nextStone);
  }

  this.pass = function() {
    this.changeStone();
    this.cnt += 1;
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
    this._mergeRemoveTable(x - 1, y, revStone);
    this._mergeRemoveTable(x + 1, y, revStone);
    this._mergeRemoveTable(x, y - 1, revStone);
    this._mergeRemoveTable(x, y + 1, revStone);

    if (x == this.koX && y == this.koY && this.removeTable.count() == 1)
      return;
    this._removeStones(this.removeTable);

    if (this.scanner.scan(x, y, this.tmpBoard, stone, StoneType.NONE).isEnabled())
      return;

    this.board.copyFrom(this.tmpBoard);
    this._updateKo();
    this.hama[stone] += this.removeTable.count();
    this.nextStone = revStone;
    this.cnt += 1;
    return true;
  }

  this._mergeRemoveTable = function(x, y, stone) {
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

  this._removeStones = function(scannedTable) {
    var sum = 0;
    for (var x = 0; x < this.size; x++)
      for (var y = 0; y < this.size; y++)
        if (scannedTable.isMarked(x, y)) {
          if (this.tmpBoard.get(x, y) != StoneType.NONE)
            sum++;
          this.tmpBoard.set(x, y, StoneType.NONE);
        }
  }
 
  this._updateKo = function() {
    this.koX = null;
    this.koY = null;
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

var Goban = function(size) {
  this.size = size;
  this.rule = new IgoRuleEngine(size);
  this.board = this.rule.board;

  this.setStone = function(x, y, stone) {
    this.board.set(x, y, stone);
  }

  this.putStone = function(x, y) {
    return this.rule.putStone(x, y);
  }

  this.getStone = function(x, y) {
    return this.board.get(x, y);
  }

  this.clear = function() {
    this.rule.clear();
  }

  this.notify = function() {
    if (this.changeEventListener)
      this.changeEventListener();
  }
}

var Move = function(x, y, stone) {
  this.x = x;
  this.y = y;
  this.stone = stone;

  this.copy = function() {
    return new Move(this.x, this.y, this.stone);
  }

  this.equals = function(other) {
    return this.x == other.x && this.y == other.y && this.stone == other.stone;
  }
}

var MoveTreeNode = function(move, parentNode) {
  this.parentNode = parentNode;
  this.move = move;
  this.children = [];
  this.childIndex = 0;

  this.copy = function(parentNode) {
    var move = this.move ? this.move.copy() : null;
    var result = new MoveTreeNode(move, parentNode);
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
    if (0 <= i && i < this.children.length)
      this.childIndex = i;
  }

  this.getChild = function() {
    if (this.hasChild())
      return this.children[this.childIndex];
  }

  this.findChildIndex = function(move) {
    for (var i = 0; i < this.children.length; i++)
      if (this.children[i].move.equals(move))
        return i;
    return null;
  }
}

var MoveTree = function(newRoot) {
  this.root = newRoot ? newRoot : new MoveTreeNode(null, null);
  this.current = this.root;

  this.put = function(move) {
    var i = this.current.findChildIndex(move);
    if (i == null) {
      var childNode = new MoveTreeNode(move, this.current); 
      this.current.addChild(childNode);
    } else {
      this.current.setChildIndex(i);
    }

    this.current = this.current.getChild();
  }

  this.forward = function() {
    if (this.current.hasChild()) {
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

  this.getMoveSequence = function() {
    var moves = [];
    for (var cur = this.current; cur != this.root; cur = cur.parentNode)
      moves.unshift(cur.move);
    return moves;
  }

  this.copy = function() {
    var tree = new MoveTree(this.root.copy(null));

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

}

var GobanPlayer = function(size, newMoveTree) { 
  this.goban = new Goban(size);
  this.moveTree = newMoveTree ? newMoveTree : new MoveTree();

  this.putStone = function(x, y) {
    var stone = this.goban.rule.nextStone;
    if (this.goban.putStone(x, y)) {
      this.moveTree.put(new Move(x, y, stone));
      this.goban.notify();
    }
  }

  this.updateGoban = function() {
    this.goban.clear();
    var moves = this.moveTree.getMoveSequence();
    for (var i = 0; i < moves.length; i++) {
      var move = moves[i];
      if (move.stone != this.goban.rule.nextStone)
        this.goban.rule.pass();
      this.goban.putStone(move.x, move.y);
    }
    this.goban.notify();
  }

  this.back = function() {
    if (this.moveTree.back())
      this.updateGoban();
  }

  this.forward = function() {
    if (this.moveTree.forward())
      this.updateGoban();
  }

  this.cut = function() {
    if (this.moveTree.cut())
      this.updateGoban();
  }

  this.isHead = function() {
    return !this.moveTree.current.hasChild();
  }

  this.copy = function() {
    var player = new GobanPlayer(this.goban.size, this.moveTree.copy());
    player.updateGoban();
    return player;
  }

  this.pass = function() {
    var stone = this.goban.rule.nextStone;
    this.moveTree.put(new Move(-1, -1, stone));
    this.goban.rule.pass();
    this.goban.notify();
  }
}

var createDrawer = function(player, id) {
  var goban = player.goban;
  var drawer = new GoDrawer(goban, id, player.moveTree);

  goban.changeEventListener = function() {
    drawer.draw();
  }
  drawer.clickEventListener = function(x, y) {
    player.putStone(x, y);
  }
  return drawer;
}
