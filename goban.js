onload = function() {
  draw();
};

var StoneType = {
  NONE: 0,
  BLACK: 1,
  WHITE: 2,
  reverse: function(stone) {
    if (stone == this.BLACK) return this.WHITE;
    if (stone == this.WHITE) return this.BLACK;
    return this.NONE;
  },
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

  this.overwrite = function(other) {
    if (this.size != other.size)
      return;
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        this.board[x][y] = other.get(x, y);
      }
    }
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

var GoDrawer = function(goban, hgrid) {
  this.canvas = document.getElementById('canvassample');
  if ( ! this.canvas || ! this.canvas.getContext ) {
    alert("hoge");
    return false;
  }

  this.ctx = this.canvas.getContext('2d');
  this.goban = goban;
  this.hgrid = hgrid;
  this.xOffset = 0;
  this.yOffset = 0;

  this.drawBackground = function() {
    var size = this.goban.size;
    var grid = this.hgrid * 2;
    var ctx = this.ctx;
    ctx.fillStyle = 'rgb(222, 184, 135)';
    ctx.fillRect(0, 0, (size + 1) * grid, (size + 1) * grid);
  }

  this.drawBoard = function() {
    var size = this.goban.size;
    var grid = this.hgrid * 2;
    var ctx = this.ctx;
    ctx.lineWidth = 2;
    for (var i = 0; i < size; i++) {
      ctx.beginPath();
      ctx.moveTo(grid, (i + 1) * grid);
      ctx.lineTo(grid * size, (i + 1) * grid);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((i + 1) * grid, grid);
      ctx.lineTo((i + 1) * grid, grid * size);
      ctx.stroke();
    }
  }

  this.drawStone = function() {
    var size = this.goban.size;
    var ctx = this.ctx;
    for (var x = 0; x < size; x++) {
      for (var y = 0; y < size; y++) {
        var stone = this.goban.getStone(x, y);
        if (stone != StoneType.NONE) {
          color = stone == StoneType.BLACK ? 'black' : 'white';

          var grid = this.hgrid * 2;
          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.arc(grid * (x + 1), grid * (y + 1), hgrid - 2, 0, Math.PI*2, false);
          ctx.fill();
          ctx.beginPath();
          ctx.strokeStyle = 'rgb(0, 0, 0)';
          ctx.lineWidth = 2;
          ctx.arc(grid * (x + 1), grid * (y + 1), hgrid - 2, 0, Math.PI*2, false);
          ctx.stroke();
        }
      }
    }
  }

  this.drawHama = function(ctx) {
    var y = this.hgrid * 2 * (this.goban.size + 1) - 6;
    ctx.fillStyle = "black";
    ctx.font = "14pt Arial";
    ctx.fillText("Black: " + this.goban.ruledGoban.getBlackHama(), 100, y);
    ctx.fillText("White: " + this.goban.ruledGoban.getWhiteHama(), 300, y);
    ctx.fillText("Cnt: " + this.goban.ruledGoban.cnt, 500, y);
  }

  this.draw = function() {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate(this.xOffset, this.yOffset);
    this.drawBackground(ctx);
    this.drawBoard(ctx);
    this.drawStone(ctx);
    this.drawHama(ctx);
    ctx.restore();
  }

  this.handleMouseEvent = function(e) {
    if (this.clickEventListener) {
      var grid = hgrid * 2;
      var rect = e.target.getBoundingClientRect();
      var x = e.clientX - rect.left - this.xOffset;
      var y = e.clientY - rect.top  - this.yOffset;
      var x = Math.round((x - grid) / grid);
      var y = Math.round((y - grid) / grid);
      this.clickEventListener(x, y);
    }
  }

  var drawer = this;
  this.canvas.addEventListener("click", function(e) {
    drawer.handleMouseEvent(e);
  });
}

var ScanTable = function(size) {
  this.size = size;
  this.table = new Array(this.size);
  this.running = true;

  for (var x = 0; x < this.size; x++) {
    this.table[x] = new Array(this.size);
  }

  this.mark = function(x, y) {
    this.table[x][y] = true;
  }

  this.isMarked = function(x, y) {
    return this.table[x][y];
  }

  this.stopScan = function() {
    this.running = false;
  }

  this.isRunning = function() {
    return this.running;
  }

  this.merge = function(other) {
    if (!other.isRunning())
      return;
    if (this.size != other.size)
      return;
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        this.table[x][y] = this.table[x][y] || other.table[x][y];
      }
    }
  }

  this.overwrite = function(other) {
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
    this.running = true;
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
      this.scanTable.stopScan();
    if (this.board.get(x, y) != this.scanableStone)
      return;
    this.scanTable.mark(x, y);

    this._scan(x + 1, y);
    this._scan(x - 1, y);
    this._scan(x, y - 1);
    this._scan(x, y + 1);
  }
}

var RuledGoban = function(size) {
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
  }
  this.clear();

  this.putStone = function(x, y) {
    var stone = this.nextStone;
    var revStone = StoneType.reverse(stone);

    if (this.board.isOutOfRange(x, y))
      return;
    if (this.board.get(x, y) != StoneType.NONE)
      return;

    this.tmpBoard.overwrite(this.board);
    this.tmpBoard.set(x, y, stone);

    this.removeTable.clear();
    this.removeTable.merge(this.scanner.scan(x - 1, y, this.tmpBoard, revStone, StoneType.NONE)); 
    this.removeTable.merge(this.scanner.scan(x + 1, y, this.tmpBoard, revStone, StoneType.NONE)); 
    this.removeTable.merge(this.scanner.scan(x, y - 1, this.tmpBoard, revStone, StoneType.NONE)); 
    this.removeTable.merge(this.scanner.scan(x, y + 1, this.tmpBoard, revStone, StoneType.NONE)); 
    if (x == this.koX && y == this.koY && this.removeTable.count() == 1)
      return;
    this._removeStones(this.removeTable);

    if (this.scanner.scan(x, y, this.tmpBoard, stone, StoneType.NONE).isRunning())
      return;

    this.board.overwrite(this.tmpBoard);
    this._updateKo();
    this.hama[stone] += this.removeTable.count();
    this.nextStone = revStone;
    this.cnt += 1;
    return true;
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
  this.ruledGoban = new RuledGoban(size);
  this.board = this.ruledGoban.board;

  this.setStone = function(x, y, stone) {
    this.board.set(x, y, stone);
  }

  this.putStone = function(x, y, stone) {
    return this.ruledGoban.putStone(x, y, stone);
  }

  this.getStone = function(x, y) {
    return this.board.get(x, y);
  }

  this.notify = function() {
    if (this.changeEventListener)
      this.changeEventListener();
  }
}

function draw() {
  goban = new Goban(19);
  drawer = new GoDrawer(goban, 20);
  goban.changeEventListener = function() {
    drawer.draw();
  }
  drawer.clickEventListener = function(x, y) {
    goban.ruledGoban.putStone(x, y);
    goban.notify();
  }
  drawer.draw();
}
