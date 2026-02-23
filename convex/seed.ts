/**
 * Seed-Funktionen für Meoluna
 * Demo-Daten für Worlds und Blog-Posts
 */

import { mutation } from "./_generated/server";

// ============================================================================
// SAMPLE WORLDS
// ============================================================================

const sampleWorlds = [
  {
    title: "Das Einmaleins-Abenteuer",
    subject: "mathematik",
    gradeLevel: "2-3",
    code: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Einmaleins-Abenteuer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 20px;
    }
    .container { text-align: center; max-width: 500px; }
    h1 { color: #FFD966; margin-bottom: 20px; font-size: 2rem; }
    .task {
      background: rgba(255,255,255,0.1);
      padding: 30px;
      border-radius: 20px;
      margin: 20px 0;
    }
    .equation { font-size: 3rem; margin: 20px 0; }
    input {
      font-size: 2rem;
      width: 100px;
      text-align: center;
      padding: 10px;
      border: 3px solid #FFD966;
      border-radius: 10px;
      background: rgba(255,255,255,0.1);
      color: white;
    }
    button {
      background: #48BB78;
      color: white;
      border: none;
      padding: 15px 40px;
      font-size: 1.2rem;
      border-radius: 10px;
      cursor: pointer;
      margin: 10px;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.05); }
    .score { font-size: 1.5rem; color: #FFD966; margin-top: 20px; }
    .feedback { font-size: 1.5rem; margin: 15px 0; min-height: 40px; }
    .correct { color: #48BB78; }
    .wrong { color: #FC8181; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌙 Einmaleins-Abenteuer</h1>
    <div class="task">
      <div class="equation">
        <span id="num1">?</span> × <span id="num2">?</span> = 
        <input type="number" id="answer" autofocus>
      </div>
      <div class="feedback" id="feedback"></div>
      <button onclick="checkAnswer()">Prüfen ✓</button>
      <button onclick="newTask()">Neue Aufgabe →</button>
    </div>
    <div class="score">⭐ Punkte: <span id="score">0</span></div>
  </div>
  <script>
    let score = 0;
    let num1, num2;
    
    function newTask() {
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      document.getElementById('num1').textContent = num1;
      document.getElementById('num2').textContent = num2;
      document.getElementById('answer').value = '';
      document.getElementById('feedback').textContent = '';
      document.getElementById('answer').focus();
    }
    
    function checkAnswer() {
      const answer = parseInt(document.getElementById('answer').value);
      const correct = num1 * num2;
      const feedback = document.getElementById('feedback');
      
      if (answer === correct) {
        score += 10;
        document.getElementById('score').textContent = score;
        feedback.textContent = '🎉 Richtig! Super gemacht!';
        feedback.className = 'feedback correct';
        if (window.Meoluna) window.Meoluna.reportScore(10);
        setTimeout(newTask, 1500);
      } else {
        feedback.textContent = '❌ Versuche es nochmal!';
        feedback.className = 'feedback wrong';
      }
    }
    
    document.getElementById('answer').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') checkAnswer();
    });
    
    newTask();
  </script>
</body>
</html>`,
  },
  {
    title: "Die Planeten unseres Sonnensystems",
    subject: "physik",
    gradeLevel: "4-6",
    code: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sonnensystem</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      min-height: 100vh;
      color: white;
      padding: 20px;
    }
    h1 { text-align: center; color: #FFD966; margin-bottom: 30px; }
    .solar-system {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .planet-card {
      background: rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 20px;
      width: 200px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .planet-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 10px 30px rgba(255,217,102,0.3);
    }
    .planet-emoji { font-size: 4rem; margin-bottom: 10px; }
    .planet-name { font-size: 1.3rem; font-weight: bold; color: #FFD966; }
    .planet-info { font-size: 0.9rem; color: #ccc; margin-top: 10px; }
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      justify-content: center;
      align-items: center;
      z-index: 100;
    }
    .modal.active { display: flex; }
    .modal-content {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      padding: 40px;
      border-radius: 20px;
      max-width: 500px;
      text-align: center;
      border: 2px solid #FFD966;
    }
    .close-btn {
      background: #FFD966;
      color: #1a1a2e;
      border: none;
      padding: 10px 30px;
      font-size: 1rem;
      border-radius: 10px;
      cursor: pointer;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <h1>🌙 Entdecke das Sonnensystem</h1>
  <div class="solar-system" id="planets"></div>
  <div class="modal" id="modal">
    <div class="modal-content">
      <div class="planet-emoji" id="modal-emoji"></div>
      <h2 id="modal-name"></h2>
      <p id="modal-details"></p>
      <button class="close-btn" onclick="closeModal()">Schließen</button>
    </div>
  </div>
  <script>
    const planets = [
      { name: 'Merkur', emoji: '🪨', info: 'Kleinster Planet', details: 'Merkur ist der kleinste und sonnennächste Planet. Ein Tag dauert 59 Erdtage!' },
      { name: 'Venus', emoji: '🌕', info: 'Heißester Planet', details: 'Die Venus ist der heißeste Planet mit 465°C Oberflächentemperatur.' },
      { name: 'Erde', emoji: '🌍', info: 'Unser Zuhause', details: 'Die Erde ist der einzige bekannte Planet mit flüssigem Wasser und Leben.' },
      { name: 'Mars', emoji: '🔴', info: 'Der rote Planet', details: 'Mars hat den höchsten Vulkan im Sonnensystem: Olympus Mons (22 km hoch).' },
      { name: 'Jupiter', emoji: '🟠', info: 'Größter Planet', details: 'Jupiter ist so groß, dass 1.300 Erden hineinpassen würden!' },
      { name: 'Saturn', emoji: '🪐', info: 'Planet mit Ringen', details: 'Saturns Ringe bestehen aus Milliarden Eisbrocken und Gesteinsstücken.' },
      { name: 'Uranus', emoji: '🔵', info: 'Liegt auf der Seite', details: 'Uranus rotiert auf der Seite - seine Achse ist um 98° geneigt!' },
      { name: 'Neptun', emoji: '💙', info: 'Windiger Riese', details: 'Neptun hat die schnellsten Winde im Sonnensystem: bis zu 2.100 km/h.' },
    ];
    
    const container = document.getElementById('planets');
    planets.forEach(planet => {
      const card = document.createElement('div');
      card.className = 'planet-card';
      card.innerHTML = \`
        <div class="planet-emoji">\${planet.emoji}</div>
        <div class="planet-name">\${planet.name}</div>
        <div class="planet-info">\${planet.info}</div>
      \`;
      card.onclick = () => showPlanet(planet);
      container.appendChild(card);
    });
    
    function showPlanet(planet) {
      document.getElementById('modal-emoji').textContent = planet.emoji;
      document.getElementById('modal-name').textContent = planet.name;
      document.getElementById('modal-details').textContent = planet.details;
      document.getElementById('modal').classList.add('active');
      if (window.Meoluna) window.Meoluna.reportScore(5);
    }
    
    function closeModal() {
      document.getElementById('modal').classList.remove('active');
    }
  </script>
</body>
</html>`,
  },
  {
    title: "Wortarten-Quiz",
    subject: "deutsch",
    gradeLevel: "3-4",
    code: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wortarten-Quiz</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 20px;
    }
    h1 { color: #FFD966; margin-bottom: 10px; }
    .subtitle { color: #A0AEC0; margin-bottom: 30px; }
    .word-box {
      background: rgba(255,255,255,0.1);
      padding: 30px 60px;
      border-radius: 20px;
      font-size: 2.5rem;
      margin: 20px 0;
      border: 3px solid #FFD966;
    }
    .options {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      justify-content: center;
      margin: 20px 0;
    }
    .option {
      background: rgba(255,255,255,0.1);
      border: 2px solid transparent;
      padding: 15px 30px;
      font-size: 1.2rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;
      color: white;
    }
    .option:hover { border-color: #FFD966; transform: scale(1.05); }
    .option.correct { background: #48BB78; border-color: #48BB78; }
    .option.wrong { background: #FC8181; border-color: #FC8181; }
    .score-bar {
      display: flex;
      gap: 30px;
      margin-top: 30px;
      font-size: 1.2rem;
    }
    .score-item { color: #A0AEC0; }
    .score-item span { color: #FFD966; font-weight: bold; }
  </style>
</head>
<body>
  <h1>🌙 Wortarten-Quiz</h1>
  <p class="subtitle">Welche Wortart ist das?</p>
  <div class="word-box" id="word">Laden...</div>
  <div class="options" id="options"></div>
  <div class="score-bar">
    <div class="score-item">Richtig: <span id="correct">0</span></div>
    <div class="score-item">Fragen: <span id="total">0</span></div>
  </div>
  <script>
    const words = [
      { word: 'Hund', type: 'Nomen', hint: 'Ein Tier' },
      { word: 'laufen', type: 'Verb', hint: 'Eine Bewegung' },
      { word: 'schnell', type: 'Adjektiv', hint: 'Wie?' },
      { word: 'Schule', type: 'Nomen', hint: 'Ein Ort' },
      { word: 'groß', type: 'Adjektiv', hint: 'Wie ist etwas?' },
      { word: 'spielen', type: 'Verb', hint: 'Was tut man?' },
      { word: 'Baum', type: 'Nomen', hint: 'Eine Pflanze' },
      { word: 'schön', type: 'Adjektiv', hint: 'Beschreibung' },
      { word: 'lesen', type: 'Verb', hint: 'Eine Tätigkeit' },
      { word: 'Sonne', type: 'Nomen', hint: 'Am Himmel' },
      { word: 'tanzen', type: 'Verb', hint: 'Bewegung zur Musik' },
      { word: 'klein', type: 'Adjektiv', hint: 'Größe' },
    ];
    
    const types = ['Nomen', 'Verb', 'Adjektiv'];
    let correct = 0, total = 0, current;
    
    function nextWord() {
      current = words[Math.floor(Math.random() * words.length)];
      document.getElementById('word').textContent = current.word;
      
      const optionsDiv = document.getElementById('options');
      optionsDiv.innerHTML = '';
      types.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'option';
        btn.textContent = type;
        btn.onclick = () => checkAnswer(type, btn);
        optionsDiv.appendChild(btn);
      });
    }
    
    function checkAnswer(selected, btn) {
      total++;
      document.querySelectorAll('.option').forEach(o => o.style.pointerEvents = 'none');
      
      if (selected === current.type) {
        correct++;
        btn.classList.add('correct');
        if (window.Meoluna) window.Meoluna.reportScore(10);
      } else {
        btn.classList.add('wrong');
        document.querySelectorAll('.option').forEach(o => {
          if (o.textContent === current.type) o.classList.add('correct');
        });
      }
      
      document.getElementById('correct').textContent = correct;
      document.getElementById('total').textContent = total;
      
      setTimeout(nextWord, 1500);
    }
    
    nextWord();
  </script>
</body>
</html>`,
  },
  {
    title: "Vokabel-Trainer Englisch",
    subject: "englisch",
    gradeLevel: "4-5",
    code: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vokabel-Trainer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 20px;
    }
    h1 { color: #FFD966; margin-bottom: 30px; }
    .card {
      background: rgba(255,255,255,0.1);
      padding: 40px 60px;
      border-radius: 20px;
      text-align: center;
      min-width: 300px;
    }
    .german { font-size: 2rem; margin-bottom: 20px; }
    .english {
      font-size: 2.5rem;
      color: #FFD966;
      min-height: 60px;
      cursor: pointer;
    }
    .english.hidden { color: transparent; background: rgba(255,217,102,0.3); border-radius: 10px; }
    .hint { color: #A0AEC0; font-size: 0.9rem; margin-top: 20px; }
    .buttons { margin-top: 30px; display: flex; gap: 15px; justify-content: center; }
    button {
      padding: 15px 30px;
      font-size: 1rem;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.05); }
    .reveal-btn { background: #FFD966; color: #1a1a2e; }
    .next-btn { background: #48BB78; color: white; }
    .progress {
      margin-top: 30px;
      color: #A0AEC0;
    }
    .progress span { color: #FFD966; font-weight: bold; }
  </style>
</head>
<body>
  <h1>🌙 Vokabel-Trainer</h1>
  <div class="card">
    <div class="german" id="german">Laden...</div>
    <div class="english hidden" id="english" onclick="reveal()">???</div>
    <p class="hint">Klicke zum Aufdecken</p>
    <div class="buttons">
      <button class="reveal-btn" onclick="reveal()">Aufdecken 👀</button>
      <button class="next-btn" onclick="nextWord()">Nächstes →</button>
    </div>
  </div>
  <div class="progress">Gelernt: <span id="count">0</span> Vokabeln</div>
  <script>
    const vocab = [
      { de: 'Hund', en: 'dog' },
      { de: 'Katze', en: 'cat' },
      { de: 'Schule', en: 'school' },
      { de: 'Buch', en: 'book' },
      { de: 'Freund', en: 'friend' },
      { de: 'Familie', en: 'family' },
      { de: 'Haus', en: 'house' },
      { de: 'Auto', en: 'car' },
      { de: 'Wasser', en: 'water' },
      { de: 'Sonne', en: 'sun' },
      { de: 'Baum', en: 'tree' },
      { de: 'Blume', en: 'flower' },
      { de: 'spielen', en: 'to play' },
      { de: 'lesen', en: 'to read' },
      { de: 'schreiben', en: 'to write' },
    ];
    
    let count = 0, current, revealed = false;
    
    function nextWord() {
      current = vocab[Math.floor(Math.random() * vocab.length)];
      document.getElementById('german').textContent = current.de;
      document.getElementById('english').textContent = '???';
      document.getElementById('english').classList.add('hidden');
      revealed = false;
    }
    
    function reveal() {
      if (!revealed) {
        document.getElementById('english').textContent = current.en;
        document.getElementById('english').classList.remove('hidden');
        revealed = true;
        count++;
        document.getElementById('count').textContent = count;
        if (window.Meoluna) window.Meoluna.reportScore(5);
      }
    }
    
    nextWord();
  </script>
</body>
</html>`,
  },
  {
    title: "Tiere im Wald",
    subject: "biologie",
    gradeLevel: "2-4",
    code: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tiere im Wald</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a2f1a 0%, #0d1f0d 100%);
      min-height: 100vh;
      color: white;
      padding: 20px;
    }
    h1 { text-align: center; color: #90EE90; margin-bottom: 30px; }
    .forest {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .animal-card {
      background: rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 25px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.3s;
    }
    .animal-card:hover { transform: scale(1.05); }
    .animal-emoji { font-size: 4rem; margin-bottom: 15px; }
    .animal-name { font-size: 1.5rem; color: #90EE90; margin-bottom: 10px; }
    .animal-fact { color: #ccc; font-size: 0.95rem; line-height: 1.5; }
    .hidden-fact { display: none; }
    .show-btn {
      margin-top: 15px;
      background: #90EE90;
      color: #1a2f1a;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
    }
    .quiz-section {
      max-width: 600px;
      margin: 40px auto 0;
      background: rgba(255,255,255,0.1);
      padding: 30px;
      border-radius: 20px;
      text-align: center;
    }
    .quiz-question { font-size: 1.3rem; margin-bottom: 20px; }
    .quiz-options { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
    .quiz-option {
      background: rgba(255,255,255,0.1);
      border: 2px solid transparent;
      padding: 10px 25px;
      border-radius: 10px;
      cursor: pointer;
      color: white;
      font-size: 1.5rem;
    }
    .quiz-option:hover { border-color: #90EE90; }
    .quiz-option.correct { background: #48BB78; }
    .quiz-option.wrong { background: #FC8181; }
  </style>
</head>
<body>
  <h1>🌲 Tiere im Wald 🌲</h1>
  <div class="forest" id="forest"></div>
  <div class="quiz-section">
    <h2 style="color: #90EE90; margin-bottom: 20px;">🎯 Tier-Quiz</h2>
    <div class="quiz-question" id="question">Laden...</div>
    <div class="quiz-options" id="options"></div>
  </div>
  <script>
    const animals = [
      { emoji: '🦊', name: 'Fuchs', fact: 'Füchse können Geräusche von Mäusen unter dem Schnee hören!' },
      { emoji: '🦌', name: 'Reh', fact: 'Rehkitze haben weiße Flecken zur Tarnung im Wald.' },
      { emoji: '🐿️', name: 'Eichhörnchen', fact: 'Eichhörnchen verstecken Nüsse und finden nicht alle wieder - so wachsen neue Bäume!' },
      { emoji: '🦉', name: 'Eule', fact: 'Eulen können ihren Kopf fast ganz herumdrehen: 270 Grad!' },
      { emoji: '🐗', name: 'Wildschwein', fact: 'Wildschweine lieben Schlammbäder - das schützt vor Insekten.' },
      { emoji: '🦔', name: 'Igel', fact: 'Ein Igel hat etwa 8.000 Stacheln auf seinem Rücken.' },
    ];
    
    // Render animals
    const container = document.getElementById('forest');
    animals.forEach(animal => {
      const card = document.createElement('div');
      card.className = 'animal-card';
      card.innerHTML = \`
        <div class="animal-emoji">\${animal.emoji}</div>
        <div class="animal-name">\${animal.name}</div>
        <div class="animal-fact hidden-fact" id="fact-\${animal.name}">\${animal.fact}</div>
        <button class="show-btn" onclick="showFact('\${animal.name}')">Wusstest du? 💡</button>
      \`;
      container.appendChild(card);
    });
    
    function showFact(name) {
      const factEl = document.getElementById('fact-' + name);
      factEl.classList.toggle('hidden-fact');
      if (!factEl.classList.contains('hidden-fact') && window.Meoluna) {
        window.Meoluna.reportScore(5);
      }
    }
    
    // Quiz
    function newQuiz() {
      const correct = animals[Math.floor(Math.random() * animals.length)];
      const question = document.getElementById('question');
      const optionsDiv = document.getElementById('options');
      
      question.textContent = 'Welches Tier ist das: ' + correct.name + '?';
      
      const shuffled = [...animals].sort(() => Math.random() - 0.5).slice(0, 4);
      if (!shuffled.find(a => a.emoji === correct.emoji)) {
        shuffled[0] = correct;
        shuffled.sort(() => Math.random() - 0.5);
      }
      
      optionsDiv.innerHTML = '';
      shuffled.forEach(animal => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = animal.emoji;
        btn.onclick = () => {
          document.querySelectorAll('.quiz-option').forEach(o => o.style.pointerEvents = 'none');
          if (animal.name === correct.name) {
            btn.classList.add('correct');
            if (window.Meoluna) window.Meoluna.reportScore(10);
          } else {
            btn.classList.add('wrong');
            document.querySelectorAll('.quiz-option').forEach(o => {
              if (o.textContent === correct.emoji) o.classList.add('correct');
            });
          }
          setTimeout(newQuiz, 1500);
        };
        optionsDiv.appendChild(btn);
      });
    }
    
    newQuiz();
  </script>
</body>
</html>`,
  },
  {
    title: "Tiere auf dem Bauernhof",
    subject: "sachunterricht",
    gradeLevel: "1-2",
    code: `import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check, X, ArrowRight, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';
import clsx from 'clsx';

const UNIVERSAL_HINTS = ["Was ist in der Aufgabe eigentlich gesucht?","Welche Informationen sind gegeben?","Kannst du die Aufgabe in kleinere Schritte zerlegen?","Welches Muster erkennst du?","Wie würdest du deinen Ansatz begründen?","Was wäre ein möglicher erster Teilschritt?","Gibt es einen alternativen Lösungsweg?","Welcher Teil ist noch unklar?","Wie würdest du das einem Freund erklären?","Welche Begriffe sind entscheidend?"];
const STOPWORDS = new Set(["der","die","das","und","oder","ein","eine","ist","sind","zu","im","in","am","an","auf","mit","von","für","als","bei","dem","den","dass","nicht","noch","du","sie","er","es","wir","man","was","wie","welche","wenn","dann","so"]);

function extractKeywords(text, max) {
  const cleaned = (text || "").toLowerCase().replace(/[^a-zäöüß\\s-]/g, " ").trim();
  const words = cleaned.split(" ").filter(w => w.length >= 4 && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, max || 3);
}

class HintEngine {
  constructor() { this.recent = []; }
  nextHint(taskText, attempt) {
    const keywords = extractKeywords(taskText, 2);
    let pool = UNIVERSAL_HINTS.filter(h => !this.recent.includes(h));
    if (pool.length === 0) { pool = UNIVERSAL_HINTS; this.recent = []; }
    const hint = pool[Math.floor(Math.random() * pool.length)];
    this.recent.push(hint);
    if (this.recent.length > 5) this.recent.shift();
    return hint.replace("{keyword}", keywords[0] || "das Thema");
  }
}

function App() {
  const [currentModule, setCurrentModule] = useState(0);
  const [currentTask, setCurrentTask] = useState(0);
  const [xp, setXp] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [completedModules, setCompletedModules] = useState([]);
  const [showHub, setShowHub] = useState(true);
  const hintEngine = useRef(new HintEngine());
  const [attempts, setAttempts] = useState({});

  const modules = [
    { id: 0, title: "Die Tiere kennenlernen", icon: "🐄", color: "from-green-500 to-green-700", tasks: [
      { type: "multiple-choice", question: "Welches Tier gibt uns Milch?", visual: (<div className="flex justify-center gap-8 mb-6"><div className="text-6xl">🐄</div><div className="text-6xl">🐔</div><div className="text-6xl">🐷</div></div>), options: ["Die Kuh", "Das Huhn", "Das Schwein", "Das Pferd"], correct: 0, explanations: { correct: "Genau! Kühe geben uns Milch.", wrong: "Die Kuh gibt uns Milch!" } },
      { type: "true-false", question: "Hühner können fliegen.", visual: (<div className="flex justify-center mb-6"><div className="text-8xl animate-bounce">🐔</div></div>), correct: false, explanations: { correct: "Richtig! Hühner können nur flattern.", wrong: "Hühner können nur ein bisschen flattern." } },
      { type: "image-analysis", question: "Wie viele Beine hat das Pferd?", visual: (<svg viewBox="0 0 200 150" className="w-64 h-48 mx-auto mb-6"><ellipse cx="100" cy="70" rx="50" ry="30" fill="#8B4513" /><ellipse cx="160" cy="50" rx="20" ry="15" fill="#8B4513" /><rect x="60" y="95" width="8" height="40" fill="#654321" /><rect x="80" y="95" width="8" height="40" fill="#654321" /><rect x="110" y="95" width="8" height="40" fill="#654321" /><rect x="130" y="95" width="8" height="40" fill="#654321" /><circle cx="165" cy="45" r="3" fill="black" /></svg>), options: ["2", "4", "6", "8"], correct: 1, explanations: { correct: "Super! Ein Pferd hat 4 Beine.", wrong: "Ein Pferd hat 4 Beine." } }
    ]},
    { id: 1, title: "Was fressen die Tiere?", icon: "🌾", color: "from-yellow-500 to-orange-600", tasks: [
      { type: "matching", question: "Was frisst welches Tier?", pairs: [{ left: "🐄 Kuh", right: "🌾 Gras" }, { left: "🐔 Huhn", right: "🌽 Körner" }, { left: "🐷 Schwein", right: "🥔 Gemüsereste" }], explanations: { correct: "Perfekt!", wrong: "Kühe fressen Gras, Hühner Körner, Schweine Gemüsereste." } },
      { type: "fill-blank", question: "Fülle die Lücke:", sentence: "Die Kuh frisst ___ auf der Weide.", visual: (<div className="flex justify-center gap-4 mb-6"><div className="text-5xl">🐄</div><div className="text-5xl">➡️</div><div className="text-5xl">❓</div></div>), options: ["Gras", "Fleisch", "Fisch"], correct: "Gras", explanations: { correct: "Genau! Kühe fressen Gras.", wrong: "Kühe fressen Gras!" } },
      { type: "multiple-choice", question: "Was trinken Kälbchen?", visual: (<div className="flex justify-center mb-6"><div className="text-7xl">🐮</div></div>), options: ["Milch von der Mama", "Limonade", "Tee", "Kaffee"], correct: 0, explanations: { correct: "Richtig! Kälbchen trinken Milch.", wrong: "Kälbchen trinken Milch von ihrer Mama." } }
    ]},
    { id: 2, title: "Tiergeräusche", icon: "🔊", color: "from-purple-500 to-pink-600", tasks: [
      { type: "multiple-choice", question: "Welches Geräusch macht die Kuh?", visual: (<div className="flex justify-center mb-6"><motion.div className="text-8xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>🐄</motion.div></div>), options: ["Muh!", "Miau!", "Wau!", "Kikeriki!"], correct: 0, explanations: { correct: "Muuuuh! Genau!", wrong: "Die Kuh macht Muh!" } },
      { type: "matching", question: "Ordne die Geräusche zu!", pairs: [{ left: "🐷 Schwein", right: "Oink!" }, { left: "🐔 Huhn", right: "Gack!" }, { left: "🐴 Pferd", right: "Wieher!" }], explanations: { correct: "Du kennst alle Tiergeräusche!", wrong: "Schwein=Oink, Huhn=Gack, Pferd=Wieher." } },
      { type: "true-false", question: "Der Hahn macht Kikeriki! wenn die Sonne aufgeht.", visual: (<div className="flex justify-center items-center gap-4 mb-6"><div className="text-6xl">🌅</div><div className="text-6xl">🐓</div></div>), correct: true, explanations: { correct: "Ja! Der Hahn kräht morgens.", wrong: "Der Hahn kräht Kikeriki! am Morgen." } }
    ]},
    { id: 3, title: "Tierbabys", icon: "🐣", color: "from-pink-400 to-red-500", tasks: [
      { type: "short-answer", question: "Wie heißt das Baby einer Kuh?", visual: (<div className="flex justify-center items-center gap-2 mb-6"><div className="text-7xl">🐄</div><div className="text-4xl">❤️</div><div className="text-5xl">🐮</div></div>), keywords: ["kalb", "kälbchen"], hint: "Es beginnt mit K...", explanations: { correct: "Genau! Das Baby heißt Kalb.", wrong: "Das Baby einer Kuh heißt Kalb." } },
      { type: "sorting", question: "Sortiere nach Größe!", items: ["🐥 Küken", "🐔 Huhn", "🐄 Kuh"], correctOrder: [0, 1, 2], explanations: { correct: "Perfekt sortiert!", wrong: "Richtig: Küken, Huhn, Kuh" } },
      { type: "multiple-choice", question: "Woraus schlüpft ein Küken?", visual: (<div className="flex justify-center gap-4 mb-6"><motion.div className="text-6xl" animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>🥚</motion.div><div className="text-4xl">➡️</div><div className="text-6xl">🐥</div></div>), options: ["Aus einem Ei", "Aus dem Bauch", "Aus Wasser", "Aus der Erde"], correct: 0, explanations: { correct: "Richtig! Küken schlüpfen aus Eiern.", wrong: "Küken schlüpfen aus Eiern!" } }
    ]},
    { id: 4, title: "Abschlussquiz", icon: "🏆", color: "from-yellow-400 to-yellow-600", tasks: [
      { type: "multiple-choice", question: "Welches Tier legt Eier?", visual: (<div className="flex justify-center gap-6 mb-6"><div className="text-5xl">🐄</div><div className="text-5xl">🐔</div><div className="text-5xl">🐴</div></div>), options: ["Das Huhn", "Die Kuh", "Das Pferd", "Das Schwein"], correct: 0, explanations: { correct: "Super! Das Huhn legt Eier.", wrong: "Nur das Huhn legt Eier." } },
      { type: "true-false", question: "Schweine baden gerne im Schlamm.", visual: (<div className="flex justify-center mb-6"><div className="text-8xl">🐷</div></div>), correct: true, explanations: { correct: "Ja! Schweine kühlen sich so ab.", wrong: "Schweine baden gerne im Schlamm." } },
      { type: "short-answer", question: "Was gibt uns die Kuh zu trinken?", visual: (<div className="flex justify-center items-center gap-4 mb-6"><div className="text-6xl">🐄</div><div className="text-4xl">➡️</div><div className="text-6xl">🥛</div></div>), keywords: ["milch"], hint: "Du trinkst es zum Frühstück...", explanations: { correct: "Genau! Die Kuh gibt uns Milch!", wrong: "Die Kuh gibt uns Milch!" } }
    ]}
  ];

  const currentModuleData = modules[currentModule];
  const currentTaskData = currentModuleData?.tasks[currentTask];
  const taskKey = currentModule + "-" + currentTask;

  const handleCorrectAnswer = () => {
    setXp(prev => prev + 10);
    Meoluna.reportScore(10, { action: 'correct_answer', module: currentModule, task: currentTask });
    confetti({ particleCount: 50, spread: 60 });
    setFeedback({ type: 'correct', message: currentTaskData.explanations.correct });
  };

  const handleWrongAnswer = (details) => {
    const d = details || {};
    const currentAttempt = (attempts[taskKey] || 0) + 1;
    setAttempts(prev => ({ ...prev, [taskKey]: currentAttempt }));
    const hint = hintEngine.current.nextHint(currentTaskData.question, currentAttempt);
    setFeedback({ type: 'wrong', message: currentTaskData.explanations.wrong, hint, selected: d.selected, correct: d.correct });
  };

  const nextTask = () => {
    setFeedback(null);
    if (currentTask < currentModuleData.tasks.length - 1) { setCurrentTask(prev => prev + 1); }
    else {
      Meoluna.completeModule(currentModule);
      Meoluna.reportScore(20, { action: 'module_complete', module: currentModule });
      setCompletedModules(prev => [...prev, currentModule]);
      if (currentModule === modules.length - 1) { Meoluna.complete(xp + 50); confetti({ particleCount: 200, spread: 100 }); }
      setShowHub(true); setCurrentTask(0);
    }
  };

  const startModule = (i) => { setCurrentModule(i); setCurrentTask(0); setFeedback(null); setShowHub(false); };

  if (showHub) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-green-400 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">🏡 Tiere auf dem Bauernhof</h1>
            <p className="text-white/90 text-lg">Lerne die Tiere kennen!</p>
          </motion.div>
          <div className="flex justify-center mb-8"><div className="bg-white/20 rounded-full px-6 py-2 flex items-center gap-2"><Star className="w-6 h-6 text-yellow-300 fill-yellow-300" /><span className="text-white font-bold text-xl">{xp} XP</span></div></div>
          <div className="bg-white/30 rounded-full h-4 mb-8 overflow-hidden"><motion.div className="bg-yellow-400 h-full rounded-full" initial={{ width: 0 }} animate={{ width: (completedModules.length / modules.length) * 100 + "%" }} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((m, i) => {
              const done = completedModules.includes(i);
              const locked = i > 0 && !completedModules.includes(i - 1);
              return (<motion.button key={m.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1 }}
                onClick={() => !locked && startModule(i)} disabled={locked}
                className={clsx("relative p-6 rounded-2xl text-left bg-gradient-to-br shadow-lg", m.color, locked ? "opacity-50 cursor-not-allowed" : "hover:scale-105 cursor-pointer", done && "ring-4 ring-yellow-300")}>
                <div className="text-4xl mb-2">{m.icon}</div><h3 className="text-white font-bold text-lg">{m.title}</h3><p className="text-white/80 text-sm">{m.tasks.length} Aufgaben</p>
                {done && <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1"><Check className="w-4 h-4 text-yellow-900" /></div>}
                {locked && <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl"><span className="text-3xl">🔒</span></div>}
              </motion.button>);
            })}
          </div>
          {completedModules.length === modules.length && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-8 bg-yellow-400 rounded-2xl p-6 text-center"><div className="text-6xl mb-4">🎉</div><h2 className="text-2xl font-bold text-yellow-900">Alle Module geschafft!</h2><p className="text-yellow-800">Du hast {xp} XP gesammelt!</p></motion.div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-green-400 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6"><button onClick={() => setShowHub(true)} className="text-white hover:text-white/80">← Zurück</button><div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-1"><Star className="w-5 h-5 text-yellow-300 fill-yellow-300" /><span className="text-white font-bold">{xp} XP</span></div></div>
        <div className="text-center mb-4"><span className="text-white/80">{currentModuleData.icon} {currentModuleData.title}</span><div className="text-white/60 text-sm">Aufgabe {currentTask + 1} von {currentModuleData.tasks.length}</div></div>
        <div className="bg-white/30 rounded-full h-2 mb-6 overflow-hidden"><div className="bg-white h-full rounded-full transition-all" style={{ width: ((currentTask + 1) / currentModuleData.tasks.length) * 100 + "%" }} /></div>
        <motion.div key={taskKey} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-white rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">{currentTaskData.question}</h2>
          {currentTaskData.visual}
          <TaskRenderer task={currentTaskData} onCorrect={handleCorrectAnswer} onWrong={handleWrongAnswer} feedback={feedback} />
          <AnimatePresence>
            {feedback && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={clsx("mt-4 p-4 rounded-xl", feedback.type === 'correct' ? "bg-green-100 border-2 border-green-400" : "bg-red-100 border-2 border-red-400")}>
              <div className="flex items-start gap-3">{feedback.type === 'correct' ? <Check className="w-6 h-6 text-green-600" /> : <X className="w-6 h-6 text-red-600" />}<div><p className={clsx("font-medium", feedback.type === 'correct' ? "text-green-800" : "text-red-800")}>{feedback.message}</p>
              {feedback.type === 'wrong' && feedback.hint && (<div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"><div className="flex items-start gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /><div><p className="text-sm font-medium text-amber-800">Mentor-Hinweis:</p><p className="text-sm text-amber-700">{feedback.hint}</p></div></div></div>)}</div></div>
              <button onClick={nextTask} className={clsx("mt-4 w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2", feedback.type === 'correct' ? "bg-green-500" : "bg-blue-500")}>Weiter <ArrowRight className="w-5 h-5" /></button>
            </motion.div>)}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function TaskRenderer({ task, onCorrect, onWrong, feedback }) {
  const [selected, setSelected] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [sortedItems, setSortedItems] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedLeft, setSelectedLeft] = useState(null);

  useEffect(() => { setSelected(null); setMatchedPairs([]); setSortedItems(task.type === 'sorting' ? [...task.items].sort(() => Math.random() - 0.5) : []); setInputValue(''); setSelectedLeft(null); }, [task]);

  if (feedback) return null;

  if (task.type === 'multiple-choice' || task.type === 'image-analysis') {
    return (<div className="grid grid-cols-2 gap-3">{task.options.map((opt, i) => (<button key={i} onClick={() => { setSelected(i); i === task.correct ? onCorrect() : onWrong({ selected: opt, correct: task.options[task.correct] }); }} disabled={selected !== null} className={clsx("p-4 rounded-xl text-center font-medium border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50", selected === i && i === task.correct && "bg-green-100 border-green-500", selected === i && i !== task.correct && "bg-red-100 border-red-500")}>{opt}</button>))}</div>);
  }
  if (task.type === 'true-false') {
    return (<div className="flex gap-4 justify-center">{[true, false].map(v => (<button key={String(v)} onClick={() => { setSelected(v); v === task.correct ? onCorrect() : onWrong(); }} disabled={selected !== null} className={clsx("px-8 py-4 rounded-xl font-bold text-lg", v ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200", selected === v && v === task.correct && "ring-4 ring-green-400", selected === v && v !== task.correct && "ring-4 ring-red-400")}>{v ? "✓ Wahr" : "✗ Falsch"}</button>))}</div>);
  }
  if (task.type === 'fill-blank') {
    return (<div><p className="text-lg text-center mb-4 text-gray-700">{task.sentence.replace('___', selected || '___')}</p><div className="flex flex-wrap gap-2 justify-center">{task.options.map(opt => (<button key={opt} onClick={() => { setSelected(opt); opt === task.correct ? onCorrect() : onWrong({ selected: opt, correct: task.correct }); }} disabled={selected !== null} className={clsx("px-4 py-2 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200", selected === opt && opt === task.correct && "bg-green-200 text-green-800", selected === opt && opt !== task.correct && "bg-red-200 text-red-800")}>{opt}</button>))}</div></div>);
  }
  if (task.type === 'matching') {
    const handleMatch = (ri) => { if (selectedLeft === null) return; const np = { left: selectedLeft, right: ri }; const nm = [...matchedPairs, np]; setMatchedPairs(nm); setSelectedLeft(null); if (nm.length === task.pairs.length) { nm.every((m,i) => m.left === m.right) ? onCorrect() : onWrong(); } };
    return (<div className="flex gap-8 justify-center"><div className="space-y-2">{task.pairs.map((p, i) => (<button key={"l"+i} onClick={() => setSelectedLeft(i)} disabled={matchedPairs.some(m => m.left === i)} className={clsx("w-full px-4 py-2 rounded-lg text-left bg-purple-100 text-purple-800", selectedLeft === i && "ring-2 ring-purple-500", matchedPairs.some(m => m.left === i) && "opacity-50")}>{p.left}</button>))}</div><div className="space-y-2">{task.pairs.map((p, i) => (<button key={"r"+i} onClick={() => handleMatch(i)} disabled={matchedPairs.some(m => m.right === i) || selectedLeft === null} className={clsx("w-full px-4 py-2 rounded-lg text-left bg-orange-100 text-orange-800", matchedPairs.some(m => m.right === i) && "opacity-50")}>{p.right}</button>))}</div></div>);
  }
  if (task.type === 'sorting') {
    const move = (fi, d) => { const ni = [...sortedItems]; const ti = fi + d; if (ti < 0 || ti >= ni.length) return; [ni[fi], ni[ti]] = [ni[ti], ni[fi]]; setSortedItems(ni); };
    const check = () => { const co = sortedItems.map(it => task.items.indexOf(it)); co.every((v, i) => v === task.correctOrder[i]) ? onCorrect() : onWrong(); };
    return (<div><div className="space-y-2 mb-4">{sortedItems.map((it, i) => (<div key={it} className="flex items-center gap-2"><span className="text-gray-400 w-6">{i+1}.</span><div className="flex-1 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">{it}</div><div className="flex flex-col gap-1"><button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">▲</button><button onClick={() => move(i, 1)} disabled={i === sortedItems.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">▼</button></div></div>))}</div><button onClick={check} className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold">Überprüfen</button></div>);
  }
  if (task.type === 'short-answer') {
    const check = () => { const n = inputValue.toLowerCase().trim(); task.keywords.some(kw => n.includes(kw.toLowerCase())) ? onCorrect() : onWrong({ userAnswer: inputValue }); };
    return (<div>{task.hint && <p className="text-gray-500 text-sm text-center mb-2">💡 Tipp: {task.hint}</p>}<input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={e => e.key === 'Enter' && inputValue && check()} placeholder="Deine Antwort..." className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-lg text-center" /><button onClick={check} disabled={!inputValue} className="w-full mt-3 py-3 bg-blue-500 text-white rounded-xl font-bold disabled:opacity-50">Überprüfen</button></div>);
  }
  return null;
}

export default App;`,
  },
];

// ============================================================================
// SAMPLE BLOG POSTS
// ============================================================================

const sampleBlogPosts = [
  {
    slug: "5-lerntipps-fuer-grundschueler",
    title: "5 Lerntipps, die wirklich funktionieren",
    excerpt: "Entdecke bewährte Methoden, mit denen Grundschulkinder effektiver und mit mehr Spaß lernen können.",
    content: `# 5 Lerntipps, die wirklich funktionieren

Lernen muss nicht langweilig sein! Mit den richtigen Methoden können Kinder effektiver lernen und dabei sogar Spaß haben.

## 1. Kurze Lerneinheiten

Kinder können sich am besten 15-20 Minuten am Stück konzentrieren. Danach brauchen sie eine kurze Pause. Die **Pomodoro-Technik** funktioniert auch für Kinder!

## 2. Spielerisch üben

Ob Karteikarten, Quiz-Apps oder Lernspiele – wenn Lernen sich wie Spielen anfühlt, bleibt mehr hängen. Meoluna macht genau das möglich!

## 3. Erklären lassen

Wenn ein Kind etwas Gelerntes erklären kann, hat es den Stoff wirklich verstanden. Lass dein Kind dir erklären, was es heute gelernt hat.

## 4. Feste Lernzeiten

Ein regelmäßiger Rhythmus hilft dem Gehirn, sich auf "Lernmodus" einzustellen. Am besten nach einer kurzen Pause nach der Schule.

## 5. Erfolge feiern

Jeder kleine Fortschritt verdient Anerkennung. Das motiviert und stärkt das Selbstvertrauen!

---

Mit Meoluna können Kinder spielerisch üben und sehen ihren Fortschritt in Echtzeit. Probiere es aus!`,
    category: "Lerntipps",
    tags: ["Grundschule", "Lernen", "Tipps", "Eltern"],
    author: "Meoluna Team",
  },
  {
    slug: "warum-spielerisches-lernen-funktioniert",
    title: "Warum spielerisches Lernen funktioniert",
    excerpt: "Die Wissenschaft hinter Gamification: Warum Kinder durch Spielen besser lernen als durch Pauken.",
    content: `# Warum spielerisches Lernen funktioniert

Spielen ist nicht das Gegenteil von Lernen – es ist eine der effektivsten Lernmethoden überhaupt!

## Das Gehirn liebt Spiele

Beim Spielen schüttet das Gehirn **Dopamin** aus – den "Glücks-Botenstoff". Dieser sorgt dafür, dass Informationen besser im Langzeitgedächtnis gespeichert werden.

## Motivation durch Belohnung

Punkte, Sterne und Level sprechen das natürliche Belohnungssystem des Gehirns an. Kinder bleiben motiviert und üben freiwillig mehr.

## Fehler sind erlaubt

In Spielen sind Fehler Teil des Prozesses. Kinder probieren ohne Angst aus und lernen aus Fehlern – genau so sollte es sein!

## Sofortiges Feedback

Spiele geben sofort Rückmeldung. Kinder sehen direkt, ob ihre Antwort richtig war, und können es sofort nochmal versuchen.

## Meoluna nutzt diese Prinzipien

Unsere Lernwelten kombinieren echte Lerninhalte mit spielerischen Elementen. So wird Mathe zum Abenteuer und Deutsch zum Quiz-Duell!`,
    category: "Wissenschaft",
    tags: ["Gamification", "Lernforschung", "Motivation"],
    author: "Meoluna Team",
  },
  {
    slug: "so-unterstuetzt-du-dein-kind-beim-lernen",
    title: "So unterstützt du dein Kind beim Lernen",
    excerpt: "Praktische Tipps für Eltern: Wie du dein Kind motivierst, ohne Druck aufzubauen.",
    content: `# So unterstützt du dein Kind beim Lernen

Als Eltern möchten wir das Beste für unsere Kinder. Aber wie unterstützen wir sie, ohne zu viel Druck aufzubauen?

## Schaffe eine gute Lernumgebung

- **Ruhiger Ort** ohne Ablenkung
- Gutes Licht und bequemer Sitzplatz
- Alle Materialien griffbereit

## Sei interessiert, nicht kontrollierend

Frag "Was hast du heute Spannendes gelernt?" statt "Hast du deine Hausaufgaben gemacht?". Interesse motiviert mehr als Kontrolle.

## Hilf bei der Planung

Manche Kinder brauchen Unterstützung beim Strukturieren. Ein gemeinsam erstellter Wochenplan kann helfen.

## Nutze digitale Hilfsmittel sinnvoll

Apps wie Meoluna können das Üben abwechslungsreicher machen. 20 Minuten Lernspiel sind oft effektiver als 40 Minuten Arbeitsblätter.

## Lob den Einsatz, nicht nur das Ergebnis

"Du hast dich echt angestrengt!" ist wertvoller als "Du bist so schlau!". Es fördert eine **Wachstums-Mentalität**.

## Geduld haben

Jedes Kind lernt in seinem eigenen Tempo. Vergleiche mit anderen Kindern helfen nicht – Ermutigung schon!`,
    category: "Eltern-Ratgeber",
    tags: ["Eltern", "Tipps", "Motivation", "Hausaufgaben"],
    author: "Meoluna Team",
  },
];

// ============================================================================
// SEED MUTATIONS
// ============================================================================

export const seedSampleWorlds = mutation({
  args: {},
  handler: async (ctx) => {
    // Prüfe ob schon Welten existieren
    const existing = await ctx.db.query("worlds").take(1);
    if (existing.length > 0) {
      return { success: false, message: "Welten existieren bereits", count: 0 };
    }

    let count = 0;
    for (const world of sampleWorlds) {
      await ctx.db.insert("worlds", {
        title: world.title,
        code: world.code,
        prompt: `Demo-Welt: ${world.title}`,
        userId: "system",
        gradeLevel: world.gradeLevel,
        subject: world.subject,
        isPublic: true,
        views: Math.floor(Math.random() * 500) + 50,
        likes: Math.floor(Math.random() * 50) + 5,
        createdAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
      count++;
    }

    return { success: true, message: `${count} Welten erstellt`, count };
  },
});

export const seedBlogPosts = mutation({
  args: {},
  handler: async (ctx) => {
    // Prüfe ob schon Posts existieren
    const existing = await ctx.db.query("blogPosts").take(1);
    if (existing.length > 0) {
      return { success: false, message: "Blog-Posts existieren bereits", count: 0 };
    }

    let count = 0;
    const now = Date.now();
    
    for (const post of sampleBlogPosts) {
      await ctx.db.insert("blogPosts", {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        tags: post.tags,
        author: post.author,
        isPublished: true,
        publishedAt: now - count * 24 * 60 * 60 * 1000, // 1 Tag Abstand
        createdAt: now - count * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });
      count++;
    }

    return { success: true, message: `${count} Blog-Posts erstellt`, count };
  },
});

// Kombinierte Seed-Funktion
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const worldsExisting = await ctx.db.query("worlds").take(1);
    const postsExisting = await ctx.db.query("blogPosts").take(1);
    
    let worldsCount = 0;
    let postsCount = 0;

    if (worldsExisting.length === 0) {
      for (const world of sampleWorlds) {
        await ctx.db.insert("worlds", {
          title: world.title,
          code: world.code,
          prompt: `Demo-Welt: ${world.title}`,
          userId: "system",
          gradeLevel: world.gradeLevel,
          subject: world.subject,
          isPublic: true,
          views: Math.floor(Math.random() * 500) + 50,
          likes: Math.floor(Math.random() * 50) + 5,
          createdAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        });
        worldsCount++;
      }
    }

    if (postsExisting.length === 0) {
      const now = Date.now();
      for (const post of sampleBlogPosts) {
        await ctx.db.insert("blogPosts", {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          tags: post.tags,
          author: post.author,
          isPublished: true,
          publishedAt: now - postsCount * 24 * 60 * 60 * 1000,
          createdAt: now - postsCount * 24 * 60 * 60 * 1000,
          updatedAt: now,
        });
        postsCount++;
      }
    }

    return {
      success: true,
      worlds: worldsCount,
      posts: postsCount,
      message: `${worldsCount} Welten, ${postsCount} Blog-Posts erstellt`,
    };
  },
});

// Fügt nur die Bauernhof-Welt mit Socratic Mentor hinzu (ohne andere Welten zu löschen)
export const addBauernhofWelt = mutation({
  args: {},
  handler: async (ctx) => {
    // Prüfe ob diese Welt schon existiert
    const existing = await ctx.db
      .query("worlds")
      .filter((q) => q.eq(q.field("title"), "Tiere auf dem Bauernhof"))
      .first();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        code: sampleWorlds.find(w => w.title === "Tiere auf dem Bauernhof")?.code || "",
      });
      return { success: true, message: "Bauernhof-Welt aktualisiert", action: "updated" };
    }
    
    // Neue Welt hinzufügen
    const bauernhof = sampleWorlds.find(w => w.title === "Tiere auf dem Bauernhof");
    if (!bauernhof) {
      return { success: false, message: "Bauernhof-Welt nicht in sampleWorlds gefunden" };
    }
    
    await ctx.db.insert("worlds", {
      title: bauernhof.title,
      code: bauernhof.code,
      prompt: `Demo-Welt: ${bauernhof.title}`,
      userId: "system",
      gradeLevel: bauernhof.gradeLevel,
      subject: bauernhof.subject,
      isPublic: true,
      views: 0,
      likes: 0,
      createdAt: Date.now(),
    });
    
    return { success: true, message: "Bauernhof-Welt hinzugefügt", action: "created" };
  },
});
