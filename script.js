    const menu = document.getElementById("menu");
    const gameArea = document.getElementById("game-area");
    const backBtn = document.getElementById("backBtn");

    let mathGameActive = false;
    let mathScore = 0;
    let mathResponseTimes = [];
    let mathQuestionStartTime = 0;
    let mathTimerInterval = null;

    let reactionMoveInterval = null;
    let reactionGreenTimeout = null;

    /*menu*/
    menu.addEventListener("click", e => {
      if (e.target.dataset.game) {
        startGame(e.target.dataset.game);
      }
    });

    backBtn.addEventListener("click", () => {
      if (mathGameActive) {
        if (mathTimerInterval) {
          clearInterval(mathTimerInterval);
          mathTimerInterval = null;
        }
        endMathGame();
      } else {
        resetApp();
      }
    });

    function resetApp() {
      gameArea.innerHTML = "";
      menu.classList.remove("hidden");
      backBtn.classList.add("hidden");

      // clear math 
      mathGameActive = false;
      mathScore = 0;
      mathResponseTimes = [];
      if (mathTimerInterval) {
        clearInterval(mathTimerInterval);
        mathTimerInterval = null;
      }

      // clear reaction
      if (reactionMoveInterval) {
        clearInterval(reactionMoveInterval);
        reactionMoveInterval = null;
      }
      if (reactionGreenTimeout) {
        clearTimeout(reactionGreenTimeout);
        reactionGreenTimeout = null;
      }
    }

    /* simon says */
    function startSimon() {
      const grid = document.createElement("div");
      grid.className = "grid";
      gameArea.appendChild(grid);

      let sequence = [];
      let userIndex = 0;
      let acceptingInput = false;

      const cells = [];

      for (let i = 0; i < 16; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        grid.appendChild(cell);
        cells.push(cell);

        cell.addEventListener("click", () => {
          if (!acceptingInput) return;

          cell.classList.add("green");
          setTimeout(() => cell.classList.remove("green"), 300);

          if (cells.indexOf(cell) !== sequence[userIndex]) {
            alert("Wrong sequence! You reached level " + sequence.length);
            resetApp();
            return;
          }

          userIndex++;
          if (userIndex === sequence.length) nextRound();
        });
      }

      function nextRound() {
        acceptingInput = false;
        userIndex = 0;
        sequence.push(Math.floor(Math.random() * 16));
        playSequence();
      }

      function playSequence() {
        let i = 0;
        const interval = setInterval(() => {
          const index = sequence[i];
          cells[index].classList.add("blue");
          setTimeout(() => cells[index].classList.remove("blue"), 400);
          i++;

          if (i >= sequence.length) {
            clearInterval(interval);
            acceptingInput = true;
          }
        }, 600);
      }

      nextRound();
    }

    /*reaction test*/
    function startReaction() {
      // Create instruction text
      const instruction = document.createElement("div");
      instruction.className = "reaction-instruction";
      instruction.textContent = "Wait for the box to turn GREEN, then click it!";
      gameArea.appendChild(instruction);

      //create container
      const container = document.createElement("div");
      container.id = "reactionContainer";
      gameArea.appendChild(container);

      //create moving box
      const box = document.createElement("div");
      box.id = "reactionBox";
      box.className = "locked";
      box.textContent = "Wait...";
      container.appendChild(box);

      let startTime = null;
      let isGreen = false;

      //random starting position
      let posX = Math.random() * (container.offsetWidth - box.offsetWidth);
      let posY = Math.random() * (container.offsetHeight - box.offsetHeight);
      box.style.left = posX + "px";
      box.style.top = posY + "px";

      //move the box randomly
      reactionMoveInterval = setInterval(() => {
        const maxX = container.offsetWidth - box.offsetWidth;
        const maxY = container.offsetHeight - box.offsetHeight;

        posX = Math.random() * maxX;
        posY = Math.random() * maxY;

        box.style.left = posX + "px";
        box.style.top = posY + "px";
      }, 800);

      //turn green after random delay
      reactionGreenTimeout = setTimeout(() => {
        box.classList.remove("locked");
        box.classList.add("green", "clickable");
        box.textContent = "CLICK!";
        startTime = performance.now();
        isGreen = true;

        //stop moving when green
        clearInterval(reactionMoveInterval);
        reactionMoveInterval = null;
      }, Math.random() * 3000 + 2000);

      //handle clicks
      box.addEventListener("click", () => {
        if (!isGreen) {
          // Clicked while red - show warning
          const warning = document.createElement("div");
          warning.style.color = "#ef4444";
          warning.style.marginTop = "15px";
          warning.style.fontSize = "1.1rem";
          warning.textContent = "❌ Too early! Wait for GREEN!";
          gameArea.appendChild(warning);
          
          setTimeout(() => warning.remove(), 1500);
          return;
        }

        //clicked while green-calculate reaction time
        const reaction = Math.round(performance.now() - startTime);
        
        //clear intervals
        if (reactionMoveInterval) {
          clearInterval(reactionMoveInterval);
          reactionMoveInterval = null;
        }

        //show result
        gameArea.innerHTML = "";
        
        const resultDiv = document.createElement("div");
        resultDiv.style.textAlign = "center";
        
        const title = document.createElement("h2");
        title.textContent = "⚡ Reaction Time";
        title.style.marginBottom = "20px";
        
        const timeDisplay = document.createElement("div");
        timeDisplay.style.fontSize = "4rem";
        timeDisplay.style.fontWeight = "bold";
        timeDisplay.style.color = "#22c55e";
        timeDisplay.style.marginBottom = "15px";
        timeDisplay.textContent = reaction + " ms";
        
        const feedback = document.createElement("p");
        feedback.style.fontSize = "1.3rem";
        feedback.style.color = "#cbd5e1";
        
        if (reaction < 200) {
          feedback.textContent = "🔥 Incredible! Lightning fast!";
        } else if (reaction < 300) {
          feedback.textContent = "⭐ Excellent reflexes!";
        } else if (reaction < 400) {
          feedback.textContent = "👍 Good job!";
        } else {
          feedback.textContent = "💪 Keep practicing!";
        }
        
        resultDiv.appendChild(title);
        resultDiv.appendChild(timeDisplay);
        resultDiv.appendChild(feedback);
        gameArea.appendChild(resultDiv);
        
        menu.classList.remove("hidden");
        backBtn.classList.add("hidden");
      });
    }

    /*quick math*/
    function startMath() {
      mathGameActive = true;
      mathScore = 0;
      mathResponseTimes = [];
      mathQuestionStartTime = 0;

      nextQuestion();

      function nextQuestion() {
        gameArea.innerHTML = "";

        //random operation type
        const operations = ['+', '-', '×', '÷'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        let a, b, correct, questionText;
        
        if (operation === '+') {
          a = Math.floor(Math.random() * 50) + 10;
          b = Math.floor(Math.random() * 50) + 10;
          correct = a + b;
          questionText = `${a} + ${b} = ?`;
        } else if (operation === '-') {
          a = Math.floor(Math.random() * 50) + 30;
          b = Math.floor(Math.random() * 30) + 5;
          correct = a - b;
          questionText = `${a} - ${b} = ?`;
        } else if (operation === '×') {
          a = Math.floor(Math.random() * 12) + 2;
          b = Math.floor(Math.random() * 12) + 2;
          correct = a * b;
          questionText = `${a} × ${b} = ?`;
        } else {
          // Division - ensure clean division
          b = Math.floor(Math.random() * 9) + 2;
          correct = Math.floor(Math.random() * 12) + 2;
          a = b * correct;
          questionText = `${a} ÷ ${b} = ?`;
        }

        const timerDisplay = document.createElement("div");
        timerDisplay.style.marginBottom = "15px";
        timerDisplay.style.fontSize = "1.1rem";
        timerDisplay.style.color = "#cbd5e1";
        gameArea.appendChild(timerDisplay);

        const scoreDisplay = document.createElement("div");
        scoreDisplay.style.marginBottom = "20px";
        scoreDisplay.style.fontSize = "1.3rem";
        scoreDisplay.style.fontWeight = "bold";
        scoreDisplay.textContent = `Score: ${mathScore}`;
        gameArea.appendChild(scoreDisplay);

        const question = document.createElement("h2");
        question.textContent = questionText;
        question.style.fontSize = "2.5rem";
        question.style.marginBottom = "20px";
        gameArea.appendChild(question);

        const optionsBox = document.createElement("div");
        optionsBox.className = "math-options";
        gameArea.appendChild(optionsBox);

        // Generate more challenging wrong options
        const options = new Set([correct]);
        while (options.size < 4) {
          let wrongAnswer;
          if (operation === '×' || operation === '÷') {
            // For multiplication/division, create closer wrong answers
            const offset = Math.floor(Math.random() * 7) - 3;
            wrongAnswer = correct + offset;
          } else {
            // For addition/subtraction, create varied wrong answers
            const offset = Math.floor(Math.random() * 15) - 7;
            wrongAnswer = correct + offset;
          }
          
          if (wrongAnswer > 0 && wrongAnswer !== correct) {
            options.add(wrongAnswer);
          }
        }

        mathQuestionStartTime = performance.now();

        if (mathTimerInterval) {
          clearInterval(mathTimerInterval);
        }
        mathTimerInterval = setInterval(() => {
          const elapsed = Math.floor(
            (performance.now() - mathQuestionStartTime) / 1000
          );
          timerDisplay.textContent = `Time: ${elapsed}s`;
        }, 1000);

        [...options]
          .sort(() => Math.random() - 0.5)
          .forEach(value => {
            const btn = document.createElement("button");
            btn.textContent = value;

            btn.onclick = () => {
              if (mathTimerInterval) {
                clearInterval(mathTimerInterval);
                mathTimerInterval = null;
              }

              const responseTime = performance.now() - mathQuestionStartTime;
              mathResponseTimes.push(responseTime);

              if (value === correct) {
                mathScore++;
                nextQuestion();
              } else {
                endMathGame();
              }
            };

            optionsBox.appendChild(btn);
          });
      }
    }

    function endMathGame() {
      mathGameActive = false;
      gameArea.innerHTML = "";

      const resultDiv = document.createElement("div");
      resultDiv.style.textAlign = "center";

      const title = document.createElement("h2");
      title.textContent = "🧮 Game Over";
      title.style.marginBottom = "20px";
      resultDiv.appendChild(title);

      if (mathResponseTimes.length === 0) {
        const noAttempt = document.createElement("p");
        noAttempt.textContent = "No questions attempted.";
        noAttempt.style.fontSize = "1.2rem";
        resultDiv.appendChild(noAttempt);
      } else {
        const avgTime =
          mathResponseTimes.reduce((a, b) => a + b, 0) / mathResponseTimes.length;

        const scoreText = document.createElement("p");
        scoreText.innerHTML = `<strong style="font-size: 3rem; color: #22c55e;">${mathScore}</strong>`;
        scoreText.style.marginBottom = "15px";
        resultDiv.appendChild(scoreText);

        const attempts = document.createElement("p");
        attempts.textContent = `Questions Attempted: ${mathResponseTimes.length}`;
        attempts.style.fontSize = "1.1rem";
        attempts.style.marginBottom = "10px";
        resultDiv.appendChild(attempts);

        const avgDisplay = document.createElement("p");
        avgDisplay.textContent = `Average Time: ${avgTime.toFixed(0)} ms`;
        avgDisplay.style.fontSize = "1.1rem";
        resultDiv.appendChild(avgDisplay);
      }

      gameArea.appendChild(resultDiv);

      menu.classList.remove("hidden");
      backBtn.classList.add("hidden");
    }

    /*router*/
    function startGame(game) {
      menu.classList.add("hidden");
      backBtn.classList.remove("hidden");
      gameArea.innerHTML = "";

      if (game === "simon") startSimon();
      if (game === "reaction") startReaction();
      if (game === "math") startMath();
    }