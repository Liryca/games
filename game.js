const crypto = require("crypto");
const readline = require("readline");
const Table = require("cli-table3");

class KeyGenerator {
  constructor() {
    this.key = this.generateKey();
  }

  generateKey() {
    return crypto.randomBytes(32);
  }

  computeHMAC(message) {
    return crypto.createHmac("sha256", this.key).update(message).digest("hex");
  }

  getKey() {
    return this.key.toString("hex");
  }
}

class GameRules {
  constructor(moves) {
    this.moves = moves;
    this.rules = this.generateRules();
  }

  generateRules() {
    const rules = {};
    for (let i = 0; i < this.moves.length; i++) {
      rules[this.moves[i]] = {};
      for (let j = 0; j < this.moves.length; j++) {
        if (i === j) {
          rules[this.moves[i]][this.moves[j]] = "Draw";
        } else if ((i + 1) % this.moves.length === j) {
          rules[this.moves[i]][this.moves[j]] = "Lose";
        } else {
          rules[this.moves[i]][this.moves[j]] = "Win";
        }
      }
    }
    return rules;
  }

  getResult(userMove, computerMove) {
    return this.rules[userMove][computerMove];
  }
}

class HelpTable {
  constructor(rules) {
    this.rules = rules;
  }

  generate() {
    const moves = Object.keys(this.rules);
    const table = new Table({
      head: ["v PC\\User >", ...moves],
      colWidths: Array(moves.length + 1).fill(10),
      style: { "padding-left": 1, "padding-right": 1 },
    });

    for (const move of moves) {
      const row = [move];
      for (const opponentMove of moves) {
        row.push(this.rules[move][opponentMove]);
      }
      table.push(row);
    }

    console.log(table.toString());
  }
}

class Game {
  constructor(moves) {
    this.moves = moves;
    this.keyGenerator = new KeyGenerator();
    this.rules = new GameRules(moves);
    this.helpTable = new HelpTable(this.rules.rules);
  }

  showMenu() {
    console.log("Choose your move:");
    this.moves.forEach((move, index) => {
      console.log(`${index + 1} - ${move}`);
    });
    console.log("0 - Exit");
    console.log("? - Help");
  }

  async play() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let userInput;

    const computerMoveIndex = Math.floor(Math.random() * this.moves.length);
    const computerMove = this.moves[computerMoveIndex];
    const hmac = this.keyGenerator.computeHMAC(computerMove);

    console.log(`HMAC: ${hmac}`);

    while (true) {
      this.showMenu();
      userInput = await new Promise((resolve) =>
        rl.question("Enter your move: ", resolve)
      );

      if (userInput === "?") {
        this.helpTable.generate();
        continue;
      }

      if (userInput === "0") {
        console.log("Game over.");
        rl.close();
        return;
      }

      const userMoveIndex = parseInt(userInput) - 1;

      if (
        isNaN(userMoveIndex) ||
        userMoveIndex < 0 ||
        userMoveIndex >= this.moves.length
      ) {
        console.log("Invalid input. Please select again.");
        continue;
      }

      const userMove = this.moves[userMoveIndex];
      const result = this.rules.getResult(userMove, computerMove);
      console.log(`Your move: ${userMove}`);
      console.log(`Computer selected: ${computerMove}`);
      console.log(`Original computer key: ${this.keyGenerator.getKey()}`);
      console.log(`Result: You ${result}!`);
      rl.close();
      return;
    }
  }
}

const args = process.argv.slice(2);

if (
  args.length < 3 ||
  args.length % 2 === 0 ||
  new Set(args).size !== args.length
) {
  console.error("Error: Expected an odd number (≥ 3) of unique strings.");
  process.exit(1);
}

const game = new Game(args);
game.play();
