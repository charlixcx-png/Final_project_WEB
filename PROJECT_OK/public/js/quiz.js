function calculateResult() {
  const form = document.getElementById('quizForm');
  const resultDisplay = document.getElementById('result');
  const answers = ['A', 'B', 'C', 'D', 'E', 'F'];
  let score = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0
  };

  for (let i = 1; i <= 10; i++) {
      const question = form[`q${i}`];
      if (question) {
          for (const answer of answers) {
              if (question.value === answer) {
                  score[answer]++;
              }
          }
      }
  }

  const maxScore = Math.max(...Object.values(score));
  let result;

  if (score.A === maxScore) {
      result = "Sustainable Star (Mostly A's): You’re a shining example of responsible consumption! You make conscious decisions in almost every aspect of your life and inspire others to follow your lead.";
  } else if (score.B === maxScore) {
      result = "Eco Enthusiast (Mostly B's): You’re highly aware and take action often, though there’s still some room for improvement. Keep going—you’re doing great!";
  } else if (score.C === maxScore) {
      result = "Conscious Consumer (Mostly C's): You’re on the right track but might need to commit more consistently to make a significant impact. Small changes can add up!";
  } else if (score.D === maxScore) {
      result = "Occasional Observer (Mostly D's): You’re somewhat aware of ethical and sustainable practices but rarely act on them. Try incorporating more responsible habits into your routine.";
  } else if (score.E === maxScore) {
      result = "Unaware Shopper (Mostly E's): Your consumption habits show little consideration for ethics or sustainability. It’s never too late to start learning and making better choices!";
  } else if (score.F === maxScore) {
      result = "Busy Bystander (Mostly F's): You may not prioritize responsible consumption because of time or lack of awareness. Begin with small steps, and you’ll notice how easy and rewarding it can be.";
  }

  resultDisplay.innerText = result;
}