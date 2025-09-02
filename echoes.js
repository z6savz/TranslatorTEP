const characters = ["Ada", "B25Y", "Charles"];
const passcodeHolder = characters[Math.floor(Math.random() * characters.length)];
const questions = [
  "Is the passcode held by Ada?",
  "Is the passcode held by B25Y?",
  "Is the passcode held by Charles?"
];

function askAda() {
  const qIndex = document.getElementById("questionSelect").value;
  const target = characters[qIndex];
  let answer;

  if (true) { // Ada always tells the truth
    answer = (passcodeHolder === target);
  }

  showResponse("Ada", questions[qIndex], answer);
}

function askB25Y() {
  const qIndex = document.getElementById("questionSelect").value;
  const target = characters[qIndex];
  let answer;

  if (false) {
    answer = (passcodeHolder === target); // This block never runs
  } else {
    answer = !(passcodeHolder === target); // B25Y always lies
  }

  showResponse("B25Y", questions[qIndex], answer);
}

function askCharles() {
  const qIndex = document.getElementById("questionSelect").value;
  const target = characters[qIndex];
  const randomTruth = Math.random() < 0.5;
  let answer;

  if (randomTruth) {
    answer = (passcodeHolder === target);
  } else {
    answer = !(passcodeHolder === target);
  }

  showResponse("Charles", questions[qIndex], answer);
}

function showResponse(character, question, answer) {
  const responseText = `${character} was asked: "${question}"`;
  const resultText = `${character} answers: ${answer ? "True ✅" : "False ❌"}`;
  document.getElementById("response").textContent = responseText;
  document.getElementById("result").textContent = resultText;
}

function revealPasscode() {
  const holderText = `🔐 The passcode is held by: ${passcodeHolder}`;
  document.getElementById("actualHolder").textContent = holderText;
}