const MAX_DIMENSION_SIZE = 32;

function setKeyListeners(){
    document.addEventListener("keydown", function(event) {
        if(!["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(event.key)){
            return;
        }
    
        let direction;
        if (event.key == "ArrowLeft"){
            direction = "left";
        } else if (event.key == "ArrowUp"){
            direction = "up";
        } else if (event.key == "ArrowRight"){
            direction = "right";
        } else if (event.key == "ArrowDown"){
            direction = "down";
        }
    
        // skip movement if focus is in an input field 
        if(document.activeElement.tagName == "INPUT") return;

        // or board is not initialized
        if(board == null) return;

        board.move(direction);
        board.draw(ctx);

        if(board.isGameover){
            board.drawGameover(ctx);
        }
    });
}

function getNumerOfColumnsAndRows(){
    let inputs = [inputNumCols, inputNumRows];
    let outputs = [];

    for(let input of inputs){
        // try to read value of input field
        let value = Number(input.value)

        if(value == NaN || value < 2){
            // else try placeholder value 
            value = Number(input.placeholder)

            // else use default = 4
            if(value == NaN || value < 2){
                value = 4;
            }
        }
        outputs.push(Math.min(value, MAX_DIMENSION_SIZE));
    }

    return outputs;
}

function onRestart(){
    let [numColumns, numRows] = getNumerOfColumnsAndRows()

    board = new Board2048(0,0,canvas.height,canvas.width,numColumns,numRows, true);
    board.draw(ctx);

    // for 2x2 gameover after init is possible
    if(board.checkIsGameover()){
        board.drawGameover(ctx);
    }
}

setKeyListeners();
const inputNumRows = document.getElementById("inputNumRows");
const inputNumCols = document.getElementById("inputNumCols");

const canvas = document.getElementById("canvas");
//actually set size
canvas.height = 700;
canvas.width = 700;

const ctx = canvas.getContext("2d");
ctx.fillStyle = "#333333"
ctx.fillRect(0, 0, canvas.width, canvas.height);

let board = null;
onRestart();