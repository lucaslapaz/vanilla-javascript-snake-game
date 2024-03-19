window.alert('W,A,S,D to control the snake.')
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 500;
let lastTimestamp = 0;
let stageSize = [33, 33];

class GameStage {
  constructor(tileWidth, tileHeight) {
    //Initialize the GameStage variables
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.gridWidth = Math.floor(canvas.width / this.tileWidth);
    this.gridHeight = Math.floor(canvas.height / this.tileHeight);
    this.direction = ["left", "right", "top", "bottom"][
      Math.floor(Math.random() * 4)
    ];
    this.initialPosition = [
      Math.floor(Math.random() * this.gridHeight),
      Math.floor(Math.random() * this.gridWidth),
    ];
    this.segments = [this.initialPosition];
    this.canChangeDirection = true;
    this.generateGrid();
    this.foods = [];
    for (let i = 0; i < 2; i++) {
      this.generateFood();
    }
    this.points = 0;
    document.addEventListener("keydown", this.keydown.bind(this));
  }

  keydown(event) {
    //Verifies the key pressed, changes the direction and set the canChangeDirection to false.
    //And after one game update the canChangeDirection variable will be changed to true.
    let tecla = event.key;
    if (this.canChangeDirection) {
      if (tecla == "w" && this.direction != "bottom") {
        this.direction = "top";
        this.canChangeDirection = false;
      } else if (tecla == "s" && this.direction != "top") {
        this.direction = "bottom";
        this.canChangeDirection = false;
      } else if (tecla == "a" && this.direction != "right") {
        this.direction = "left";
        this.canChangeDirection = false;
      } else if (tecla == "d" && this.direction != "left") {
        this.direction = "right";
        this.canChangeDirection = false;
      }
    }
  }

  generateGrid() {
    //Generate a new empty grid that will be filled later with snake segments and foods
    this.stageGrid = [];
    for (let yy = 0; yy < this.gridHeight; yy++) {
      this.stageGrid.push([]);
      for (let xx = 0; xx < this.gridWidth; xx++) {
        this.stageGrid[yy][xx] = 0;
      }
    }
  }

  draw() {
    //Draw the grid and the elements according to the grid items value,
    //where 1 corresponde the snake segment, 2 corresponds to snake head and 3 corresponds to foods
    for (let yy = 0; yy < this.gridHeight; yy++) {
      for (let xx = 0; xx < this.gridWidth; xx++) {
        ctx.beginPath();
        ctx.rect(
          xx * this.tileWidth,
          yy * this.tileHeight,
          this.tileWidth,
          this.tileHeight
        );
        let actualTile = this.stageGrid[yy][xx];
        if (actualTile === 1) {
          ctx.fillStyle = "white";
          ctx.fill();
        } else if (actualTile === 2) {
          ctx.fillStyle = "crimson";
          ctx.fill();
        } else if (actualTile === 3) {
          ctx.fillStyle = "green";
          ctx.fill();
        } else {
          ctx.strokeStyle = "white";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  gridInsertFoods() {
    //This function will be called after the new empty grid generation.
    //It changes the stage grid, setting the value to 3 where the position corresponds to the foods array items
    for (let f = 0; f < this.foods.length; f++) {
      let food = this.foods[f];
      this.stageGrid[food[0]][food[1]] = 3;
    }
  }

  gridInsertSnake() {
    let previousPosition = [];
    for (let seg = 0; seg < this.segments.length; seg++) {
      let yy = this.segments[seg][0];
      let xx = this.segments[seg][1];
      let previousPositionBackup = [yy, xx];

      //If first segment (head), calculate the next position
      if (seg === 0) {
        switch (this.direction) {
          case "left":
            xx = xx - 1;
            break;
          case "right":
            xx = xx + 1;
            break;
          case "top":
            yy = yy - 1;
            break;
          case "bottom":
            yy = yy + 1;
        }
        if (xx < 0) {
          xx = this.stageGrid[yy].length - 1;
        } else if (xx > this.stageGrid[0].length - 1) {
          xx = 0;
        }
        if (yy < 0) {
          yy = this.stageGrid.length - 1;
        } else if (yy > this.stageGrid.length - 1) {
          yy = 0;
        }

        //Verify if the next position is equals to food tile
        if (this.stageGrid[yy][xx] === 3) {
          this.removeFood(yy, xx);
          this.incrementSegment();
          this.generateFood();
        }

        //Verify if the next position correspond to some snake's segment
        for (let [a, b] of this.segments) {
          if (a === yy && b === xx) {
            this.gameOver();
          }
        }

        //Change the first segmento to the next position
        this.segments[seg][0] = yy;
        this.segments[seg][1] = xx;
        this.stageGrid[yy][xx] = 2;
      } else {
        //If not the first segment, change the position to the previous
        this.segments[seg][0] = previousPosition[0];
        this.segments[seg][1] = previousPosition[1];
        this.stageGrid[this.segments[seg][0]][this.segments[seg][1]] = 1;
      }
      //Save the actual segment initial position to be use by the next segment
      previousPosition = previousPositionBackup;
    }
  }
  
  verifyEndGame(){
    //Verifies if the free tiles amount is enough to finish the game
    let tilesAmount = this.gridWidth * this.gridHeight;
    let tilesUsed = this.segments.length + this.foods.length;
    if(tilesAmount - tilesUsed <= 5){
      this.gameFinished();
    }
  }

  update() {
    //In order:
    //-> generate empty grid
    //-> insert the foods into the grid
    //-> insert the snake segments into the grid
    //-> verify if the game is finished
    //-> draw the grid tiles
    this.generateGrid();
    this.gridInsertFoods();
    this.gridInsertSnake();
    this.verifyEndGame();
    this.draw();
    //After an update, it become possible to move again if direction has been changed by keyboard
    this.canChangeDirection = true;
  }

  gameOver() {
    //Creates a new instance of GameStage and replaces the current instance in the renderList array
    for (let i = 0; i < renderList.length; i++) {
      if (renderList[i] instanceof GameStage) {
        renderList[i] = new GameStage(stageSize[0], stageSize[1]);
      }
    }
  }

  gameFinished(){
    //Removes the game instance and creates a new MenuInterface instance.
    for (let i = 0; i < renderList.length; i++) {
      if (renderList[i] instanceof GameStage) {
        renderList.splice(i, 1);
        renderList.push(new MenuInterface('Congratulations!', "Play again"));
      }
    }
  }

  removeFood(yy, xx) {
    //It receives the coordinates and removes the item from the foods array
    let index = this.foods.findIndex((item) => {
      return item[0] == yy && item[1] == xx;
    });
    if (index > -1) {
      this.foods.splice(index, 1);
    }
  }

  generateFood() {
    //Transforms the grid into unidimensional array filtering if the position is being used by snake segments or food
    //and randomly choose one position to insert into foods array
    let grid1d = [];
    for (let yy = 0; yy < this.gridHeight; yy++) {
      for (let xx = 0; xx < this.gridWidth; xx++) {
        let tileFree = true;
        //verify if the actual position is being used by snake segment
        for (let segment of this.segments) {
          if (yy == segment[0] && xx == segment[1]) {
            tileFree = false;
          }
        }
        //verify if the actual position is being used by food
        if (this.foods) {
          for (let food of this.foods) {
            if (yy == food[0] && xx == food[1]) {
              tileFree = false;
            }
          }
        }
        //if the actual position is free adds to the unidimensional array
        if (tileFree) {
          grid1d.push([[yy], [xx]]);
        }
      }
    }
    //randomly choose one position from unisimensional array
    let position = grid1d[Math.floor(Math.random() * grid1d.length)];
    this.foods.push([position[0], position[1]]);
  }

  incrementSegment() {
    //Inserts a new segment at the end of segments array, copying the last segment position
    let newSegment = this.segments[this.segments.length - 1];
    this.segments.push([newSegment[0], newSegment[1]]);
  }
}

class MenuInterface {
  constructor(logoText, buttonText) {
    //Initializes the variables
    this.buttonWidth = 170;
    this.buttonHeight = 40;
    this.overButton = false;
    this.logoText = logoText;
    this.buttonText = buttonText;
    this.mouse = {
      x: 0,
      y: 0,
    };
    this.mousemoveHandler = this.mousemove.bind(this);
    this.mousedownHandler = this.mousedown.bind(this);
    canvas.addEventListener("mousemove", this.mousemoveHandler);
    canvas.addEventListener("mousedown", this.mousedownHandler);
  }
  mousemove(event) {
    //updates the mouse position
    this.mouse.x = event.offsetX;
    this.mouse.y = event.offsetY;
  }
  mousedown() {
    //Verifies if the cursor is over the button when pressed and initiate the game if so
    if (this.overButton) {
      canvas.removeEventListener("mousemove", this.mousemoveHandler);
      canvas.removeEventListener("mousedown", this.mousedownHandler);
      this.play();
    }
  }
  play() {
    //Removes the MenuInterface instance and adds a new GameStage instance 
    for (let i = 0; i < renderList.length; i++) {
      if (renderList[i] instanceof MenuInterface) {
        renderList.splice(i, 1);
        renderList.push(new GameStage(stageSize[0], stageSize[1]));
      }
    }
  }
  draw() {
    //Draw the Play button
    ctx.save();
    ctx.beginPath();
    ctx.translate(
      canvas.width / 2 - this.buttonWidth / 2,
      canvas.height / 2 - this.buttonHeight / 2
    );
    ctx.strokeStyle = "white";
    ctx.rect(0, 0, this.buttonWidth, this.buttonHeight);
    if (this.overButton) {
      ctx.strokeStyle = "black";
      ctx.fillStyle = "white";
      ctx.fill();
    }

    ctx.font = "22px serif";
    const text = ctx.measureText(this.buttonText);
    ctx.strokeText(
      this.buttonText,
      0 + this.buttonWidth / 2 - text.width / 2,
      0 + this.buttonHeight / 2 + 5.5
    );
    ctx.stroke();
    ctx.restore();

    //Draw the Text Logo
    ctx.strokeStyle = "white";
    ctx.font = "50px serif";
    const logoMeasure = ctx.measureText(this.logoText);
    ctx.strokeText(
      this.logoText,
      canvas.width / 2 - logoMeasure.width / 2,
      canvas.height / 2 - (canvas.height / 2 / 2 - 48)
    );
  }
  update() {
    //Verifies if the mouse position corresponds to the button position and set the overButton true if so
    this.overButton = false;
    if (
      this.mouse.x > canvas.width / 2 - this.buttonWidth / 2 &&
      this.mouse.x < canvas.width / 2 + this.buttonWidth / 2
    ) {
      if (
        this.mouse.y > canvas.height / 2 - this.buttonHeight / 2 &&
        this.mouse.y < canvas.height / 2 + this.buttonHeight / 2
      )
        this.overButton = true;
    }
    this.draw();
  }
}
//Creates a array with objects that will be draw on the screen
const renderList = [];
renderList.push(new MenuInterface("Snake Game", "Play"));

const animate = function (timestamp) {
  //Updates the frame each 100 milliseconds
  let delta = timestamp - lastTimestamp;
  if (delta >= 100) {
    lastTimestamp = timestamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const object of renderList) {
      object.update();
    }
  }
  requestAnimationFrame(animate);
};

animate();
