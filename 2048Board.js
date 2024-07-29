const COLOR_BACKGROUND = "#555555"
const COLOR_UNUSEDBACKGROUND = "#ff2222"
const COLOR_TILE_BACKGROUND = "#888888"

class Board{
    constructor(xPos,yPos,maxWidthPx,maxHeightPx,widthTiles=5,heightTiles=5,squareTiles=true){
        this.top = yPos;
        this.left = xPos;
        this.maxWidth = maxWidthPx;
        this.maxHeight = maxHeightPx;
        this.widthInTiles = widthTiles;
        this.heightInTiles = heightTiles;

        this.tileWidth;
        this.tileHeight;
        this.borderWidth;
        this.borderHeight;
        this.tileRects = Array()
        this.calculateSizes(squareTiles);
        this.initTiles();
        
        this.bottom = this.top+this.maxHeight;
        this.right = this.left+this.maxWidth;
    }

    calculateSizes(squareTiles=true){
        let borderFactor = 0.1;

        this.borderWidth = (this.maxWidth/this.widthInTiles)*borderFactor;
        this.borderHeight = (this.maxHeight/this.heightInTiles)*borderFactor;

        this.tileWidth = (this.maxWidth-this.borderWidth*(this.widthInTiles+1))/this.widthInTiles;
        this.tileHeight = (this.maxHeight-this.borderHeight*(this.heightInTiles+1))/this.heightInTiles;

        if(squareTiles){
            this.borderWidth = this.borderHeight = Math.min(this.borderWidth, this.borderHeight);
            this.tileWidth = this.tileHeight = Math.min(this.tileWidth, this.tileHeight);
        }

        // area actually covered by tiles and borders 
        this.width = this.widthInTiles * (this.tileWidth+this.borderWidth) + this.borderWidth;
        this.height = this.heightInTiles * (this.tileHeight+this.borderHeight) + this.borderHeight;
    }

    initTiles(){
        for(let colIdx = 0; colIdx < this.widthInTiles; colIdx++){
            let colX = this.left + (this.borderWidth+this.tileWidth)*colIdx + this.borderWidth
            let colArray = Array();
            for(let rowIdx = 0; rowIdx < this.heightInTiles; rowIdx++){
                let rowY = this.top + (this.borderHeight+this.tileHeight)*rowIdx + this.borderHeight;
                colArray.push({x: colX, y:rowY, w:this.tileWidth, h:this.tileHeight});
            }
            this.tileRects.push(colArray);
        }
    }

    drawBackground(ctx, drawUnusedArea=true, color=null){
        if(drawUnusedArea){
            //area of originally given max-w,max-h that is not used
            ctx.fillStyle = COLOR_UNUSEDBACKGROUND;
            ctx.fillRect(this.left, this.top, this.maxWidth, this.maxHeight);
        }

        ctx.fillStyle = (color == null)? COLOR_BACKGROUND : color;
		ctx.fillRect(this.left, this.top, this.width, this.height);
    }

    drawTileByXYIndex(ctx, rowIdx, colIdx, color="red"){
        ctx.fillStyle = color;
        ctx.fillRect(
            this.tileRects[rowIdx][colIdx].x,
            this.tileRects[rowIdx][colIdx].y,
            this.tileRects[rowIdx][colIdx].w,
            this.tileRects[rowIdx][colIdx].h
        )
    }

    drawTileBackgrounds(ctx){
        for(let rowIdx = 0; rowIdx < this.widthInTiles; rowIdx++){
            for(let colIdx = 0; colIdx < this.heightInTiles; colIdx++){
                this.drawTileByXYIndex(ctx, rowIdx, colIdx, COLOR_TILE_BACKGROUND);
            }
        }
    }

    draw(ctx){
        this.drawBackground(ctx);
        this.drawTileBackgrounds(ctx);
    }
}

const Directions = {
	Up: 0,
	Down: 1,
	Left: 2,
	Right: 3
}

class Tile{
    constructor(x,y,value=0,left=null,right=null,up=null,down=null){
        this.x = x;
        this.y = y;
        this.value = value;
        this.left = left;
        this.right = right;
        this.up = up;
        this.down = down;
    }

    getNext(direction){
        if(direction == Directions.Up){
            return this.up;
        } else if(direction == Directions.Down){
            return this.down;
        } else if(direction == Directions.Left){
            return this.left;
        } else if(direction == Directions.Right){
            return this.right;
        }
    }

    setDirectionalConnections(field){
        this.left = (this.x == 0)? null : field[this.x-1][this.y];
        this.right = (this.x == field.length-1)? null : field[this.x+1][this.y];
        this.up = (this.y == 0)? null : field[this.x][this.y-1];
        this.down = (this.y == field[0].length-1)? null : field[this.x][this.y+1];
    }
}

class Board2048 extends Board{
    constructor(xPos,yPos,maxWidthPx,maxHeightPx,w=4,h=4){
        super(xPos,yPos,maxWidthPx,maxHeightPx,w,h,true);

        this.w = w;
        this.h = h;

        this.numberOfTiles = this.w*this.h;
        this.numberOfEmptyTiles = this.numberOfTiles; //TODO basically unused

        this.randFkt = Math.random; // default to Math.random, allow usage of custom generators
        this.tiles = null;
        this.font = null; // initialize in first draw
        
        this.colors = {
            2: "#8888ff", 4: "#6666ff", 8: "#4444ff", 16: "#2222ff", 32: "#0000ff",
            64: "#88ff88", 128: "#66ff66", 256: "#44ff44", 512: "#22ff22", 1024: "#00ff00",
            2048: "#ff8888", 4096: "#ff6666", 8192: "#ff4444", 16384: "#ff2222", 32768: "#ff0000"
        };
        this.tileColorWhenUndefined = "#000000"; // if values above 32768 are reached 

        this.isGameover;
        this.score;
        this.blockedDirections;

        this.initialize();
    }

    randInt(exclusiveMax){
        return Math.floor( this.randFkt()*exclusiveMax );
    }

    initialize(){
        this.isGameover = false;
        this.score = 0;
        this.freeAllDirections();
        this.tiles = Array();

        // tile values
        for(let x = 0; x < this.w; x++){
            let columnTiles = Array();
            for(let y = 0; y < this.h; y++){
                columnTiles.push(new Tile(x,y,0));
            }
            this.tiles.push(columnTiles);
        }

        // init directional connections
        for(let x = 0; x < this.w; x++){
            for(let y = 0; y < this.h; y++){
                this.tiles[x][y].setDirectionalConnections(this.tiles);
            }
        }

        // create some intial tiles
        this.numberOfEmptyTiles = this.numberOfTiles;
        let numInitialTiles = 2 + this.randInt(3); // range [2,4]
        for(let i = 0; i < numInitialTiles; i++){
            this.createNewTile();
        }
    }

    freeAllDirections(){
        this.blockedDirections = [];
    }

    move(direction){ //TODO - input being strings kinda sucks
        let dir = Directions.Up;
        let dirNext;
        let x,y;
        if( direction == "up" ){
            dir = Directions.Down;
            dirNext = Directions.Right;
            x = 0;
            y = 0;
        } else if( direction == "down" ){
            dir = Directions.Up;
            dirNext = Directions.Right;
            x = 0;
            y = this.h-1;
        } else if( direction == "left" ){
            dir = Directions.Right;
            dirNext = Directions.Down;
            x = 0;
            y = 0;
        } else if( direction == "right" ){
            dir = Directions.Left;
            dirNext = Directions.Down;
            x = this.w-1;
            y = 0;
        } else {
            console.error("this should never happen!! direction:", direction)
        }

        if(this.blockedDirections[dir]){
            return false;
        }
        let hasMoved = false;

        let firstTile = this.tiles[x][y]; // used to jump to next row/col depending on direction 
        while(firstTile != null){
            let tile = firstTile;
            let next = tile.getNext(dir);
            while(tile != null && next != null){
                // if empty, move others to position 
                if(tile.value == 0){
                    if(next.value != 0){
                        hasMoved = true;
                        tile.value = next.value;
                        next.value = 0;
                    }
                    next = next.getNext(dir);
                    continue;
                }

                // not empty -> find non-empty next
                if(next.value == 0){
                    next = next.getNext(dir);
                    continue;
                }

                // merge if matching
                if(tile.value == next.value){
                    hasMoved = true;
                    this.score += tile.value;
                    tile.value += next.value;
                    next.value = 0;
                }

                tile = tile.getNext(dir)
                if(tile == next){
                    next = next.getNext(dir);
                }
            }
            firstTile = firstTile.getNext(dirNext); // go to next row/col
        }

        if(hasMoved){
            this.freeAllDirections()
            this.createNewTile();

            this.checkIsGameover();
            return true;
        } else {
            this.blockedDirections[dir] = true;
            return false;
        }
    }

    // https://bost.ocks.org/mike/shuffle/
    shuffleArray(array) {
        var m = array.length, t, i;
      
        // While there remain elements to shuffle…
        while (m) {
          // Pick a remaining element…
          i = Math.floor(this.randFkt() * m--);
      
          // And swap it with the current element.
          t = array[m];
          array[m] = array[i];
          array[i] = t;
        }
    }

    createNewTile(){
        //create on random free spot
        let indices = [...Array(this.numberOfTiles).keys()];
        this.shuffleArray(indices);

        let newValue = Math.pow(2, 1+this.randInt(3)); // 2^n with n in [1,2,3] -> [2,4,8]
        for(let i = 0; i < this.numberOfTiles; i++){
            let x = indices[i]%this.w;
            let y = Math.floor(indices[i]/this.w);

            if(this.tiles[x][y].value == 0){
                this.tiles[x][y].value = newValue;
                this.numberOfEmptyTiles -= 1;
                return 
            }
        }        
    }

    getValuesAs1DArray(){
        let res = Array();
        for(let y = 0; y < this.h; y++){
            for(let x = 0; x < this.w; x++){
                res.push(this.tiles[x][y].value);
            }
        }
        return res;
    }

    checkIsGameover(){
        this.isGameover = false;
        for(let y = 0; y < this.h; y++){
            for(let x = 0; x < this.w; x++){
                let tile = this.tiles[x][y];
                // empty tiles
                if( tile.value == 0 ){
                    return false;
                }
                // can move in x
                if(x<this.w-1 && tile.value == this.tiles[x+1][y].value){
                    return false;
                }
                //can move in y
                if(y<this.h-1 && tile.value == this.tiles[x][y+1].value){
                    return false;
                }
            }
        }
        this.isGameover = true;
        return true
    }

    drawTiles(ctx){
        for(let xIdx = 0; xIdx < this.w; xIdx++){
            for(let yIdx = 0; yIdx < this.h; yIdx++){
                if(this.tiles[xIdx][yIdx].value == 0) continue;

                // use backup color if no color for value defined
                let color = this.colors[this.tiles[xIdx][yIdx].value];
                if(color == undefined){
                    color = this.tileColorWhenUndefined;
                }

                drawTextInRect(ctx,
                    this.tileRects[xIdx][yIdx].x,
                    this.tileRects[xIdx][yIdx].y,
                    this.tileRects[xIdx][yIdx].w,
                    this.tileRects[xIdx][yIdx].h,
                    this.tiles[xIdx][yIdx].value,
                    this.font,
                    true, "white", 
                    color           
                )
            }
        }
    }

    drawGameover(ctx){
        // red block with score, filling width, from bottom up to middle of lowest tile
        let x = 0;
        let w = this.width;

        let y = this.height - this.tileHeight/2 - this.borderHeight;
        let h = this.height - y;

        // if whole board does not start at 0,0
        x += this.left;
        y += this.top;

        let font = findMaxFontSizeFromWidth(ctx, this.tileWidth, "99999")
        drawTextInRect(ctx, x, y, w, h, "Score:" + this.score, font, true, "white", "red")
    }

    testColors(){
        var size = Object.keys(this.colors).length;
        let value = 1;
        let x,y;
        for(let i = 0; i < size; i++){
            value *= 2;
            console.log(x,y,this.colors[value])

            x = i % this.w;
            y = Math.floor(i/this.w);
            this.drawTileByXYIndex(ctx, x,y,this.colors[value]);
        }
    }

    draw(ctx){
        if(this.font == null){
            this.font = findMaxFontSizeFromWidth(ctx, this.tileWidth, "99999")
        }
        this.drawBackground(ctx);
        this.drawTileBackgrounds(ctx);
        this.drawTiles(ctx);
    }
}





