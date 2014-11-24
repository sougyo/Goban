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

  this.update = function(other) {
    if (this.size != other.size)
      return;
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        this.board[x][y] = other.get(x, y);
      }
    }
  }

  this.count = function(stone) {
    var c = 0;
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        if (this.board[x][y] == stone) c++;
      }
    }
    return c;
  }

  this.clear = function() {
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        this.board[x][y] = StoneType.NONE;
      }
    }
  }

  this.isOutOfRange = function(x, y) {
    return x < 0 || this.size <= x || y < 0 || this.size <= y;
  }

  this.clear();
}

var GoDrawer = function(goban, canvasid) {
  this.canvas = document.getElementById(canvasid);
  if ( ! this.canvas || ! this.canvas.getContext ) {
    return;
  }
  this.ctx = this.canvas.getContext('2d');
  this.goban = goban;

  this.paddingTop    = 10;
  this.paddingBottom = 50;
  this.paddingLeft   = 20;
  this.paddingRight  = 20;

  this.resize = function() {
    this.canvasWidth  = $(this.canvas).width();
    this.canvasHeight = $(this.canvas).height();

    this.boardAreaWidth  = this.canvasWidth  - this.paddingLeft - this.paddingRight;
    this.boardAreaHeight = this.canvasHeight - this.paddingTop  - this.paddingBottom;
    this.hgrid = Math.floor(Math.min(this.boardAreaWidth, this.boardAreaHeight) / (2 * this.goban.size));
    this.grid  = this.hgrid * 2;
    var boardSize = this.grid * this.goban.size;

    this.xOffset = (this.boardAreaWidth  - boardSize) / 2 + this.paddingLeft;
    this.yOffset = (this.boardAreaHeight - boardSize) / 2 + this.paddingTop;

    this.ctx.canvas.width  = this.canvasWidth;
    this.ctx.canvas.height = this.canvasHeight;
    this.draw();
  }

  this.toX = function(x) {
    return this.grid * x + this.hgrid;
  }

  this.toY = function(y) {
    return this.grid * y + this.hgrid;
  }

  this.drawBackground = function() {
    this.ctx.fillStyle = 'rgb(222, 184, 135)';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  this.drawBoard = function() {
    var size = this.goban.size;
    var grid = this.grid;
    var ctx = this.ctx;
    ctx.lineWidth = 1;
    for (var i = 0; i < size; i++) {
      ctx.beginPath();
      ctx.moveTo(this.toX(0), this.toY(i));
      ctx.lineTo(this.toX(size - 1), this.toY(i));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.toX(i), this.toY(0));
      ctx.lineTo(this.toX(i), this.toY(size - 1));
      ctx.stroke();
    }
  }

  this.drawPoint = function() {
    var size = this.goban.size;
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

    var ctx = this.ctx;
    var pointSize = this.hgrid / 4;
    var toX = this.toX;
    var toY = this.toY;
    ctx.fillStyle = 'black';
    points.forEach(function(p){
      var x = p[0];
      var y = p[1];
      ctx.beginPath();
      ctx.arc(toX(x), toY(y), pointSize, 0, Math.PI*2, false);
      ctx.fill();
    });
  }

  this.drawStone = function() {
    var size = this.goban.size;
    var stoneSize = this.hgrid - 2;
    var ctx = this.ctx;
    for (var x = 0; x < size; x++) {
      for (var y = 0; y < size; y++) {
        var stone = this.goban.getStone(x, y);
        if (StoneType.exists(stone)) {
          color = stone == StoneType.BLACK ? 'black' : 'white';

          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.arc(this.toX(x), this.toY(y), stoneSize, 0, Math.PI*2, false);
          ctx.fill();
          ctx.beginPath();
          ctx.strokeStyle = 'rgb(0, 0, 0)';
          ctx.lineWidth = 2;
          ctx.arc(this.toX(x), this.toY(y), stoneSize, 0, Math.PI*2, false);
          ctx.stroke();
        }
      }
    }
  }

  this.drawHama = function() {
    if (this.paddingBottom < 10)
      return;
    var ctx = this.ctx;
    var y = this.paddingTop + this.boardAreaHeight + 5;
    ctx.fillStyle = "black";
    ctx.font = "14pt Arial";
    ctx.fillText("Cnt: "   + this.goban.rule.cnt, 20, y);
    ctx.fillText("Black: " + this.goban.rule.getBlackHama(), 100, y);
    ctx.fillText("White: " + this.goban.rule.getWhiteHama(), 200, y);
  }

  this.draw = function() {
    this.drawBackground();

    var ctx = this.ctx;
    ctx.save();
    ctx.translate(this.xOffset, this.yOffset);
    this.drawBoard();
    this.drawPoint();
    this.drawStone();
    this.drawHama();
    ctx.restore();
  }

  this.handleMouseEvent = function(e) {
    if (this.clickEventListener) {
      var grid = this.grid;
      var rect = e.target.getBoundingClientRect();
      var x = e.clientX - rect.left - this.xOffset;
      var y = e.clientY - rect.top  - this.yOffset;
      var x = Math.floor(x / grid);
      var y = Math.floor(y / grid);
      this.clickEventListener(x, y);
    }
  }

  this.resize();

  var drawer = this;
  this.canvas.addEventListener("click", function(e) {
    var upX = e.clientX;
    var upY = e.clientY;
    var downX = drawer.downX;
    var downY = drawer.downY;
    if (Math.sqrt(Math.pow((upX - downX), 2) + Math.pow((upY - downY), 2) < drawer.hgrid)) {
      drawer.handleMouseEvent(e);
    }
  });
  this.canvas.addEventListener("mousedown", function(e) {
    drawer.downX = e.clientX;
    drawer.downY = e.clientY;
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
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        this.table[x][y] = this.table[x][y] || other.table[x][y];
      }
    }
  }

  this.update = function(other) {
    this.clear();
    this.merge(other);
  }

  this.count = function() {
    var c = 0;
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        if (this.table[x][y]) c++;
      }
    }
    return c;
  }

  this.clear = function() {
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        this.table[x][y] = false;
      }
    }
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

    this.tmpBoard.update(this.board);
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

    this.board.update(this.tmpBoard);
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
}

var MoveTreeNode = function(move, parentNode) {
  this.parentNode = parentNode;
  this.move = move;
  this.children = [];

  this.addChild = function(child) {
    this.children.push(child);
  }

  this.removeChild = function(n) {
    this.children.splice(n, 1);
  }

  this.hasChild = function() {
    return this.children.length > 0;
  }
}

var MoveTree = function() {
  this.root = new MoveTreeNode(null, null);
  this.current = this.root;

  this.addChild = function(move) {
    if (this.current.hasChild())
      return;
    var childNode = new MoveTreeNode(move, this.current); 
    this.current.addChild(childNode);
    this.current = childNode;
  }

  this.forward = function() {
    if (this.current.hasChild()) {
      this.current = this.current.children[0];
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
      this.current.removeChild(0);
      return true;
    }
  }

  this.getMoveSequence = function() {
    var moves = [];
    for (var cur = this.current; cur != this.root; cur = cur.parentNode)
      moves.unshift(cur.move);
    return moves;
  }

  this._copyHelper = function(oldNode, newNode, tree) {
    if (oldNode === this.current)
      tree.current = newNode;

    for (var i = 0; i < oldNode.children.length; i++) {
      var oldChild = oldNode.children[i];
      var newChild = new MoveTreeNode(oldChild.move.copy(), newNode);
      this._copyHelper(oldChild, newChild, tree);
      newNode.addChild(newChild);
    }
  }

  this.copy = function() {
    var tree = new MoveTree();
    this._copyHelper(this.root, tree.root, tree);
    return tree;
  }

}

var GobanPlayer = function(size, newMoveTree) { 
  this.goban = new Goban(size);
  this.moveTree = newMoveTree ? newMoveTree : new MoveTree();

  this.putStone = function(x, y) {
    if (!this.isHead())
      return;

    var stone = this.goban.rule.nextStone;
    if (this.goban.putStone(x, y)) {
      this.moveTree.addChild(new Move(x, y, stone));
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
    //todo
  }
}

var createDrawer = function(player, id) {
  var goban = player.goban;
  var drawer = new GoDrawer(goban, id);

  goban.changeEventListener = function() {
    drawer.draw();
  }
  drawer.clickEventListener = function(x, y) {
    player.putStone(x, y);
  }
  return drawer;
}
