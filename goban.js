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

var isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

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

var IgoPoint = function(x, y) {
  this.x = x;
  this.y = y;

  function toChar(x) {
    if (0 <= x && x < 26)
      return String.fromCharCode("a".charCodeAt() + x);
    else if (26 <= x && x < 52)
      return String.fromCharCode("A".charCodeAt() + x - 26);
  }

  this.toString = function() {
    if (this.x >= 0 && this.y >= 0) {
      var strX = toChar(this.x);
      var strY = toChar(this.y);
      if (strX && strY)
        return strX + strY;
    }
    return ""
  }

  this.copy = function() {
    return new IgoPoint(this.x, this.y);
  }
}

var SgfPropParser = function() {
  var parseIgoPointX = function(c) {
    if (c.match(/^[a-z]$/))
      return c.charCodeAt() - "a".charCodeAt();

    if (c.match(/^[A-Z]$/))
      return c.charCodeAt() - "A".charCodeAt() + 26;
  }

  function parseIgoPoint(str) {
    if (str.match(/^$/))
      return new IgoPoint(-1, -1);

    if (str.match(/^[a-zA-Z][a-zA-Z]$/)) {
      var x = parseIgoPointX(str[0]);
      var y = parseIgoPointX(str[1]); 
      if (x >= 0 && y >= 0)
        return new IgoPoint(x, y);
    }
  }

  function parseNumber(str) {
    if (str.match(/^[+-]?\d+$/))
      return Number(str);
  }

  function parseReal(str) {
    if (str.match(/^[+-]?\d+(\.\d+)?$/))
      return Number(str);
  }

  function parseSimpleText(str) {
    // TODO
    return str;
  }

  function parseText(str) {
    // TODO
    return str;
  }

  function orParser(parse1, parse2) {
    return function(block) {
      var r1 = parse1(block);
      return r1 ? r1 : parse2(block);
    }
  }

  function genOneParser(parse) {
    return function(blocks) {
      if (blocks.length == 1)
        return parse(blocks[0]);
    };
  }

  function genManyParser(parse) {
    return function(blocks) {
      var result = [];
      for (var i = 0; i < blocks.length; i++) {
        var p = parse(blocks[i]);
        if (!p)
          return;
        result.push(p);
      }
      return result;
    }
  }

  return {
    B:  genOneParser(parseIgoPoint),
    KO: genOneParser(parseIgoPoint),
    MN: genOneParser(parseIgoPoint),
    W:  genOneParser(parseIgoPoint),

    AB: genManyParser(parseIgoPoint),
    AE: genManyParser(parseIgoPoint),
    AW: genManyParser(parseIgoPoint),

    C:  genOneParser(parseText),

    CA: genOneParser(parseSimpleText),
    FF: genOneParser(parseNumber),
    GM: genOneParser(parseNumber),
    ST: genOneParser(parseNumber),
    SZ: genOneParser(parseNumber),

    AN: genOneParser(parseSimpleText),
    BR: genOneParser(parseSimpleText),
    BT: genOneParser(parseSimpleText),
    CP: genOneParser(parseSimpleText),
    DT: genOneParser(parseSimpleText),
    EV: genOneParser(parseSimpleText),
    GN: genOneParser(parseSimpleText),
    GC: genOneParser(parseText),
    ON: genOneParser(parseSimpleText),
    OT: genOneParser(parseSimpleText),
    PB: genOneParser(parseSimpleText),
    PC: genOneParser(parseSimpleText),
    PW: genOneParser(parseSimpleText),
    PE: genOneParser(parseSimpleText),
    RO: genOneParser(parseSimpleText),
    RU: genOneParser(parseSimpleText),
    SO: genOneParser(parseSimpleText),
    TM: genOneParser(parseReal),
    US: genOneParser(parseSimpleText),
    WR: genOneParser(parseSimpleText),
    WT: genOneParser(parseSimpleText),

    BL: genOneParser(parseReal),
    OB: genOneParser(parseNumber),
    OW: genOneParser(parseNumber),
    WL: genOneParser(parseReal),
  };
}();

var SgfReader = function() {
  this.Eof            = 0;
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
    this.rest = str.replace(/\s+$/, "");
    this.pos  = 0;

    var tree = new SgfTree();
    this.readCollection(tree.root);
    tree.resetIndexes();
    return tree;
  }

  this.readCollection = function(parentNode) {
    while (this.readGameTree(parentNode));
  }

  this.readGameTree = function(parentNode) {
    if (!this.readTokenByType(this.LeftParenthes))
      return;

    var nodes = this.readNodeSequence(parentNode);
    if (nodes.length == 0)
      this.parseError();

    this.readCollection(nodes[nodes.length - 1]);

    this.consumeToken(this.RightParenthes);
    return true;
  }

  this.readNodeSequence = function(parentNode) {
    var nodes = []
    var node = parentNode;
    while(node = this.readNode(node))
      nodes.push(node);
    return nodes;
  }

  this.readNode = function(parentNode) {
    if (!this.readTokenByType(this.Semicolon))
      return;

    var node = new SgfNode(parentNode);

    var ident;
    while (ident_token = this.readTokenByType(this.UcWord)) {
      var ident = ident_token.data;
      var blocks = [];
      while(block_token = this.readTokenByType(this.BracketBlock))
        blocks.push(block_token.data);
      
      var parser = SgfPropParser[ident];
      if (parser) {
        var p = parser(blocks);
        if (p)
          node.setProperty(ident, p);
      } else
        node.setProperty(ident, blocks);
    }

    parentNode.addChild(node);
    return node;
  }

  this.readTokenByType = function(type) {
    token = this.nextToken();

    if (token.type == type)
      return token;

    if (token.type != this.Eof)
      this.cacheToken(token);
  }

  this.consumeToken = function(type) {
    var token = this.nextToken();
    if (token.type != type)
      throw new Error("Parse Error: Expected:" + type + " Actual:" + token.type + " at:" + this.pos);
  }

  this.cache = null;
  this.cacheToken = function(token) {
    this.cache = token;
  }

  this.nextToken = function() {
    if (this.cache) {
      var ret = this.cache;
      this.cache = null;
      return ret;
    }

    this.skipSpace();
    
    if (!this.rest[0])
      return new this.Token(this.Eof, true);

    switch (this.rest[0]) {
      case '(':
        this.nextPos(1);
        return new this.Token(this.LeftParenthes, true);
      case ')':
        this.nextPos(1);
        return new this.Token(this.RightParenthes, true);
      case ';':
        this.nextPos(1);
        return new this.Token(this.Semicolon, true);
      case '[':
        var p = 0;
        do {
          p = this.rest.indexOf("]", p + 1);
          if (p == -1)
            this.parseError();
        } while (this.rest[p - 1] == '\\');
        var block = this.nextPos(p + 1).slice(1, -1);
        return new this.Token(this.BracketBlock, block);
      default:
        var tmp = this.rest.match(/[^A-Z]/);
        if (!tmp || tmp.index == 0)
          this.parseError();

        var ident = this.nextPos(tmp.index);
        return new this.Token(this.UcWord, ident);
    }
  }

  this.skipSpace = function() {
    result = this.rest.match(/[^\s]/);
    if (result)
      this.nextPos(result.index);
  }

  this.nextPos = function(n) {
    if (!n)
      return ""

    var ret = this.rest.substr(0, n);
    this.rest = this.rest.substr(n);
    this.pos += n;
    return ret;
  }

  this.parseError = function() {
    throw new Error("Parse Error at:" + this.pos + " rest: '" + this.rest.substr(0, 10) + "'");
  }
}

var SgfWriter = function() {
  this.writeSgf = function(tree) {
    this.result = "";
    this.writeHelepr(tree.root, true);
    return this.result;
  }

  this.writeHelepr = function(node, force) {
    var children = node.children;
    var flag = force || (children.length == 1 ? false : true);

    for (var i = 0; i < children.length; i++) {
      if (flag) this.append("(");
      var child = children[i];
      this.append(child);
      this.writeHelepr(child);
      if (flag) this.append(")");
    }
  }

  this.append = function(str) {
    this.result += str;
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

  this.setProperties = function(props, overwrite) {
    for (key in props) {
      if (overwrite || !this.getProperty(key)) {
        var val = props[key];
        if (val)
          this.setProperty(key, props[key]);
      }
    }
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

  this.getChildAt = function(index) {
    return this.children[index];
  }

  this.setChild = function(child) {
    this.children[this.childIndex] = child;
  }

  var propValue2str = function(propValue) {
    if (!propValue)
      return "[]";

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

  this.resetIndexes = function() {
    this.current = this.root;
    this.resetIndexesHelper(this.root);
  }

  this.resetIndexesHelper = function(node) {
    node.setChildIndex(0);
    var children = node.children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.parentNode != node)
        throw new Error("detect invalid link");
      this.resetIndexesHelper(child);
    }
  }
}

var Move = function(x, y, stone) {
  this.x = x;
  this.y = y;
  this.stone = stone;
}

var PropUtil = function(tree) {
  this.tree = tree;

  var movePropDict = {
    "B": StoneType.BLACK,
    "W": StoneType.WHITE
  };

  var setupPropDict = {
    "AB": StoneType.BLACK,
    "AW": StoneType.WHITE,
    "AE": StoneType.NONE 
  };

  function val2ident(dict, val) {
    for (ident in dict)
      if (dict[ident] == val)
        return ident;
  }

  function existsIn(dict, node) {
    for (ident in dict)
      if (node.hasProperty(ident))
        return true;
    return false;
  }

  function removeMatchedSetupPoint(node, x, y) {
    for (ident in setupPropDict) {
      var points = node.getProperty(ident);
      if (points) {
        for (var i = 0; i < points.length; i++) {
          var p = points[i];
          if (p.x == x && p.y == y) {
            points.splice(i, 1);
            break;
          }
        }
        if (points.length == 0)
          node.removeProperty(ident);
      }
    }
  }

  this.getMoveFrom = function(node) {
    for (ident in movePropDict) {
      var p = node.getProperty(ident);
      if (p)
        return new Move(p.x, p.y, movePropDict[ident]);
    }
  }

  this.addMoveProperty = function(x, y, stone) {
    var stoneIdent = val2ident(movePropDict, stone);
    if (!stoneIdent)
      return;

    var node = this.tree.current;
    for (var i = 0; i < node.children.length; i++) {
      var p = node.getChildAt(i).getProperty(stoneIdent);
      if (p && p.x == x && p.y == y) {
        this.tree.forwardTo(i);
        return;
      }
    }
    this.tree.newChild();
    this.tree.current.setProperty(stoneIdent, new IgoPoint(x, y));
  }

  this.getSetupMovesFrom = function(node) {
    var result = [];
    for (ident in setupPropDict) {
      var points = node.getProperty(ident);
      if (points) {
        for (var i = 0; i < points.length; i++) {
          var p = points[i];
          result.push(new Move(p.x, p.y, setupPropDict[ident]));
        }
      }
    }
    return result;
  }

  this.addSetupProperty = function(x, y, stone) {
    var stoneIdent = val2ident(setupPropIdent, stone);
    if (!stoneIdent)
      return;

    if (!existsIn(setupPropDict, this.tree.current))
      this.tree.insertNewNode();

    var node = this.tree.current;
    removeMatchedSetupPoint(node, x, y);
    var points = node.getProperty(stoneIdent);
    if (points)
      points.push(new IgoPoint(x, y));
    else
      node.setProperty(stoneIdent, [new IgoPoint(x, y)]);
  }

  this.isStoneProp = function() {
    var node = this.tree.current();
    return (this.getMoveFrom(node) || this.getSetupMovesFrom(node)) ? true : false;
  }

  this.isRootNode = function() {
    return this.tree.current == this.tree.root;
  }

  this.isRootPropNode = function() {
    return this.tree.current.parentNode == this.tree.root;
  }

  this.getRootPropNode = function() {
    return this.tree.root.getChild();
  }

  this.getGameInfoPropNode = function() {
    return this.getRootPropNode();
  }

  this.isLeafNode = function() {
    return !this.tree.current.hasChild();
  }

  this.backToHead = function() {
    while (true) {
      if (this.isRootNode() || this.isRootPropNode())
        break;
      this.tree.back();
    }
  }

  this.forwardToTail = function() {
    while (true) {
      if (this.isLeafNode())
        break;
      this.tree.forward();
    }
  }

  this.getGobanSize = function() {
    return this.getRootPropNode().getProperty("SZ");
  }

  this.initIgoTree = function(size) {
    tree.resetIndexes();

    if (tree.root.hasChild())
      tree.forward();
    else
      tree.newChild();

    this.getRootPropNode().setProperties({
      "FF": 4,
      "GM": 1,
      "SZ": size
    }, false);
  }
}

var IgoTreeFactory = new function() {
  var igoTree = function(size, tree) {
    var propUtil = new PropUtil(tree);
    propUtil.initIgoTree(size);
    return tree;
  }

  this.create = function(size) {
    var tree = new SgfTree();
    return igoTree(size, tree);
  }

  this.createBySgf = function(sgf) {
    var reader = new SgfReader();
    var tree = reader.readSgf(sgf);
    return igoTree(null, tree);
  }
}();

var IgoPlayer = function(igoTree) {
  this.sgfTree = igoTree;
  this.propUtil = new PropUtil(igoTree);

  this.size = this.propUtil.getGobanSize();
  if (!this.size)
    throw new Error("cannot get size");

  this.rule = new IgoRuleEngine(this.size);
  this.listeners = [];

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
    this.backN(1);
  }

  this.backN = function(n) {
    for (var i = 0; i < n; i++) {
      if (this.propUtil.isRootPropNode())
        break;
      this.sgfTree.back();
    }
    this.updateGoban();
  }

  this.forward = function() {
    this.forwardN(1);
  }

  this.forwardN = function(n) {
    for (var i = 0; i < n; i++) {
      if (!this.sgfTree.current.hasChild())
        break;
      this.sgfTree.forward();
    }
    this.updateGoban();
  }

  this.backToHead = function() {
    this.propUtil.backToHead();
    this.updateGoban();
  }

  this.forwardToTail = function() {
    this.propUtil.forwardToTail();
    this.updateGoban();
  }

  this.cut = function() {
    if (this.propUtil.isRootPropNode())
      return;
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

var DrawerEnv = function(size, ctx) {
  this.size = size;
  this.ctx  = ctx;

  this.paddingTop    = 5;
  this.paddingBottom = 5;
  this.paddingLeft   = 10;
  this.paddingRight  = 10;

  this.resize = function(width, height) {
    this.canvasWidth  = width;
    this.canvasHeight = height;

    this.boardAreaWidth  = this.canvasWidth  - this.paddingLeft - this.paddingRight;
    this.boardAreaHeight = this.canvasHeight - this.paddingTop  - this.paddingBottom;
    this.hgrid = Math.floor(Math.min(this.boardAreaWidth, this.boardAreaHeight) / (2 * size));
    this.grid  = this.hgrid * 2;
    this.boardSize = this.grid * size;

    this.xOffset = (this.boardAreaWidth  - this.boardSize) / 2 + this.paddingLeft;
    this.yOffset = (this.boardAreaHeight - this.boardSize) / 2 + this.paddingTop;

    ctx.canvas.width  = this.canvasWidth;
    ctx.canvas.height = this.canvasHeight;
  }

  this.drawLine = function(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  this.drawCircle = function(x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2, false);
    if (fill)
      ctx.fill();
    else
      ctx.stroke();
  }

  this.drawImage = function(image, x, y, width, height) {
    try {
      ctx.drawImage(image, x, y, width, height);
    } catch (e) {
      if (e.name != "NS_ERROR_NOT_AVAILABLE")
      throw e;
    }
  }

  this.toX = function(i) {
    return this.grid * i + this.hgrid + this.xOffset;
  }

  this.toY = function(j) {
    return this.grid * j + this.hgrid + this.yOffset;
  }

  this.toI = function(x) {
    return Math.floor((x - this.xOffset) / this.grid);
  }

  this.toJ = function(y) {
    return Math.floor((y - this.yOffset) / this.grid);
  }

  this.mouseEventToIJ= function(e) {
    var rect = e.target.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    return { i: this.toI(x), j: this.toJ(y) };
  }
}

var GoDrawer = function(size, ctx) {
  this.env = new DrawerEnv(size, ctx);
  this.handlers = [];

  this.addDrawHandler = function(handler) {
    this.handlers.push(handler);
  }

  this.resize = function(width, height) {
    this.env.resize(width, height);
    this.draw();
  }

  this.draw = function() {
    for (var i = 0; i < this.handlers.length; i++) {
      var handler = this.handlers[i];
      if (handler.draw) {
        ctx.save();
        handler.draw(this.env);
        ctx.restore();
      }
    }
  }
}

var DefaultGoDrawerFactory = function() {

  var BackgroundDrawer = function(option) {
    var bgColor  = option.shouldGet("bgColor", "white");
    var boardImg = option.shouldGet("boardImg");

    this.draw = function(env) {
      env.ctx.fillStyle = bgColor;
      env.ctx.fillRect(0, 0, env.canvasWidth, env.canvasHeight);
      env.ctx.drawImage(boardImg, env.xOffset, env.yOffset, env.boardSize, env.boardSize);
    }
  }

  var GridDrawer = function(option) {
    var lineWidth = option.shouldGet("lineWidth", 1);
    var lineColor = option.shouldGet("lineColor", "black");

    this.draw = function(env) {
      this.drawLine(env);
      this.drawPoint(env);
    }

    this.drawLine = function(env) {
      var size = env.size;
      env.ctx.lineWidth   = Number(lineWidth);
      env.ctx.strokeStyle = lineColor;
      for (var i = 0; i < size; i++) {
        env.drawLine(env.toX(0), env.toY(i), env.toX(size - 1), env.toY(i));
        env.drawLine(env.toX(i), env.toY(0), env.toX(i), env.toY(size - 1));
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
        env.drawCircle(env.toX(p[0]), env.toY(p[1]), pointSize, true);
      }
    }
  }

  var StoneDrawer = function(option, player) {
    var blackStoneColor = option.shouldGet("blackStoneColor", "black");
    var whiteStoneColor = option.shouldGet("whiteStoneColor", "white");
    var blackStoneImg   = option.shouldGet("blackStoneImg");
    var whiteStoneImg   = option.shouldGet("whiteStoneImg");

    this.draw = function(env) {
      this.drawShadow(env);
      this.drawCircle(env);
      this.drawImage(env);
    }

    this.drawShadow = function(env) {
      var size = env.size;
      var offset = env.hgrid / 6;
      var shadowSize = env.hgrid * 0.9;
      var ctx = env.ctx;
      ctx.fillStyle = 'black';
      ctx.globalAlpha = 0.2;
      for (var i = 0; i < size; i++)
        for (var j = 0; j < size; j++)
          if (StoneType.exists(player.getStone(i, j)))
            env.drawCircle(env.toX(i) - offset, env.toY(j) + offset, shadowSize, true);
    }

    this.drawCircle = function(env) {
      var size = env.size;
      var stoneSize = env.hgrid - 1;
      var ctx = env.ctx;
      ctx.globalAlpha = 1.0;

      for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
          var stone = player.getStone(i, j);
          if (StoneType.exists(stone)) {
            var color = stone == StoneType.BLACK ? blackStoneColor : whiteStoneColor;
            ctx.fillStyle = color;
            ctx.strokeStyle = 'rgb(0, 0, 0)';
            ctx.lineWidth = 1;
            env.drawCircle(env.toX(i), env.toY(j), stoneSize, true);
          }
        }
      }
    }

    this.drawImage = function(env) {
      var size = env.size;
      var imgSize = env.grid - 2;
      for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
          var stone = player.getStone(i, j);
          if (StoneType.exists(stone)) {
            var img = stone == StoneType.BLACK ? blackStoneImg : whiteStoneImg;
            env.drawImage(img, env.toX(i) - imgSize / 2, env.toY(j) - imgSize / 2, imgSize, imgSize);
          }
        }
      }
    }
  }

  var HamaDrawer = function(option, player) {
    this.draw = function(env) {
      if (env.paddingBottom < 20)
        return;
      var ctx = env.ctx;
      var y = env.paddingTop + env.boardAreaHeight + 25;
      var basex = env.xOffset + 5;
      ctx.fillStyle = "black";
      ctx.font = "14pt Arial";
      ctx.fillText("Cnt: "   + player.rule.cnt, basex + 0, y);
      ctx.fillText("Black: " + player.rule.getBlackHama(), basex + 80, y);
      ctx.fillText("White: " + player.rule.getWhiteHama(), basex + 160, y);
    }
  }

  var ChildrenDrawer = function(option, player) {
    var branchPointColor = option.shouldGet("branchPointColor", "pink");
    this.draw = function(env) {
      var tree = player.sgfTree;
      var nodes = tree.current.children;
      if (nodes.length < 2)
        return;
      var pointSize = env.hgrid / 2;
      env.ctx.fillStyle = branchPointColor;
      var stone = player.rule.nextStone;
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var move = player.propUtil.getMoveFrom(node);
        if (move.stone == stone)
          env.drawCircle(env.toX(move.x), env.toY(move.y), pointSize, true);
      }
    }
  }

  function createImage(drawer, path) {
    var img = new Image();
    img.src = path;
    img.onload = function() {
      drawer.draw();
    }
    return img;
  }

  this.create = function(player, ctx, opt) {
    var drawer = new GoDrawer(player.size, ctx);

    var option = {}
    for (key in opt)
      option[key] = opt[key];

    option.blackStoneImg = createImage(drawer, opt.blackStoneImagePath);
    option.whiteStoneImg = createImage(drawer, opt.whiteStoneImagePath);
    option.boardImg = createImage(drawer, opt.boardImagePath);

    option.shouldGet = function(key, defaultVal) {
      var x = this[key];
      if (x)
        return x;
      else if(defaultVal)
        return defaultVal;

      return null;//should raise error
    }

    drawer.addDrawHandler(new BackgroundDrawer(option));
    drawer.addDrawHandler(new GridDrawer(option));
    drawer.addDrawHandler(new StoneDrawer(option, player));
    drawer.addDrawHandler(new HamaDrawer(option, player));
    drawer.addDrawHandler(new ChildrenDrawer(option, player));

    return drawer;
  }
}

var createDrawer = function(player, id, opt) {
  var canvas = document.getElementById(id);
  if (!canvas || !canvas.getContext)
    return;
  var ctx = canvas.getContext('2d');

  var factory = new DefaultGoDrawerFactory();
  var drawer = factory.create(player, ctx, opt);
  
  var env = drawer.env;
  var downPos = {};

  canvas.addEventListener("click", function(e) {
    var p = env.mouseEventToIJ(e);
    var r = e.target.getBoundingClientRect();
    if (p.i    == downPos.p.i    &&
        p.j    == downPos.p.j    &&
        r.left == downPos.r.left &&
        r.top  == downPos.r.top)
      player.putStone(p.i, p.j);
  });

  canvas.addEventListener("mousedown", function(e) {
    downPos.p = env.mouseEventToIJ(e);
    downPos.r = e.target.getBoundingClientRect();
  });

  player.addListener(function() {
    drawer.draw();
  });

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
   SgfReader: SgfReader,
   SgfWriter: SgfWriter,
  }
}

