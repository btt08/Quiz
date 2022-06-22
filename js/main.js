import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-database.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-auth.js';

const NUM_QUESTIONS = 10;
const DIFFICULTY = 'easy';
const TIME_DELAY = 1000;
let score = 0;

const firebaseConfig = {
  apiKey: "AIzaSyBoge9h2RF4dv-pGKdWw22DCZZuxwaciZQ",
  authDomain: "quiz-4502a.firebaseapp.com",
  databaseURL: "https://quiz-4502a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "quiz-4502a",
  storageBucket: "quiz-4502a.appspot.com",
  messagingSenderId: "574674803141",
  appId: "1:574674803141:web:31fc94b601db44dc8213ac",
  measurementId: "G-S8Y1M92JHS"
};

const contentAnswers = [...document.querySelectorAll('.answer')];

document.getElementById('formLogin').addEventListener('submit', (e) => e.preventDefault());
document.getElementById('formSignUp').addEventListener('submit', (e) => e.preventDefault());

document.getElementById('btnSubmitLogIn').addEventListener('click', loginUser);
document.getElementById('btnSubmitSignUp').addEventListener('click', signUpUser);
document.getElementById('btnSignUp').addEventListener('click', showSignUp);
document.getElementById('btnStart').addEventListener('click', e => startQuiz('', false));
document.getElementById('btnStartCloud').addEventListener('click', e => startQuiz('', true));
document.getElementById('btnStartGeneral').addEventListener('click', e => startQuiz(9, false));
document.getElementById('btnStartSports').addEventListener('click', e => startQuiz(21, false));
document.getElementById('btnStartAnimals').addEventListener('click', e => startQuiz(27, false));

document.getElementById('btnGoHomepage').addEventListener('click', () => window.location.reload());

createChart();

function showSignUp() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('signUp').style.display = 'flex';
}

function loginUser(e) {
  e.preventDefault();
  const auth = getAuth(initializeApp(firebaseConfig));
  const email = document.getElementById('mail').value;
  const pass = document.getElementById('pwd').value;
  //funcion para loguearse
  signInWithEmailAndPassword(auth, email, pass)
    .then(response => {
      //si login ha ido correctamente
      document.getElementById('login').style.display = 'none';
      document.getElementById('homepage').style.display = 'block';

      console.log('USER LOGUEADO CORRECTAMENTE', response);
    })
    .catch(error => alert(error.code, error.message));
}

function signUpUser(e) {
  e.preventDefault();

  const form = document.getElementById('formSignUp');
  const username = form.userName.value;
  const email = form.mailSignUp.value;
  const pass = form.pwd1.value;
  const pass2 = form.pwd2.value;

  const auth = getAuth(initializeApp(firebaseConfig));

  if (pass !== '' && pass2 !== '' && pass === pass2) {
    createUserWithEmailAndPassword(auth, email, pass)
      .then(response => {
        alert('Usuario creado correctamente');
        window.location.reload();
      })
      .catch(error => alert(error.code, error.message));
  } else {
    alert('las contraseñas no coinciden')
  }
}

async function startQuiz(cat, cloud) {
  document.getElementById('homepage').style.display = 'none';
  const arrQuestions = await (cloud ? getCloudQuestions() : getQuestions(cat));

  contentAnswers.forEach(
    (answer) => answer.addEventListener('click', (e) => treatAnswer(e, arrQuestions)));

  nextQuestion(arrQuestions);

  document.getElementById('quiz').style.display = 'block';
}

function nextQuestion(arrQuestions) {
  const arrStrAnswers = shuffle([arrQuestions[0].correct_answer, ...arrQuestions[0].incorrect_answers]);

  document.getElementById('question').innerHTML = arrQuestions[0].question;

  for (let i = 0; i < arrStrAnswers.length; i++) {
    contentAnswers[i].innerHTML = arrStrAnswers[i];
  }
}

function treatAnswer(e, arrQuestions) {
  const elemClickedAnswer = e.target;

  // Las respuestas vienen con caracteres especiales y es la forma de asegurarse que se convierten en los simbolos que representan para poder comprobar si la respuesta es correcta
  // Ejemplo de caracteres: &quot; => ("") &amp; => (&) &#039; => (') &Uuml; => (Ü)
  const elemCorrectAnswer = document.getElementById('correctAnswer');
  elemCorrectAnswer.innerHTML = arrQuestions[0].correct_answer.trim();
  const strCorrectAnswer = elemCorrectAnswer.innerHTML;

  colourAnswers(elemClickedAnswer, strCorrectAnswer);

  if (elemClickedAnswer.innerText === strCorrectAnswer) score++;

  setTimeout(() => {
    if (arrQuestions.length > 1) {
      arrQuestions.shift();
      decolourAnswers();
      nextQuestion(arrQuestions);
    } else {
      document.getElementById('quiz').style.display = 'none';
      document.querySelector('.score').innerHTML = `<sup>${score}</sup>/<sub>${NUM_QUESTIONS}</sub>`;
      writeToLS();
      document.getElementById('results').style.display = 'block';
    }

  }, TIME_DELAY);
}

function colourAnswers(elemClickedAnswer, strCorrectAnswer) {
  contentAnswers.forEach(answer => {
    answer.disabled = true;
    const type = (answer.innerText === strCorrectAnswer) ? 'correct' : answer === elemClickedAnswer ? 'wrong' : 'grayout';
    answer.classList.add(type);
  });
}

function decolourAnswers() {
  contentAnswers.forEach(answer => {
    answer.classList.remove('correct', 'wrong', 'grayout');
    answer.disabled = false;
  });
}

function writeToLS() {
  const date = new Date();
  const fullDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  const obj = {
    score,
    fullDate
  };

  const storedData = JSON.parse(localStorage.getItem('scores')) ?? [];
  storedData.push(obj);
  if (storedData.length > 10) storedData.shift();
  localStorage.setItem('scores', JSON.stringify(storedData));
}

async function getQuestions(cat) {
  const baseUrl = 'https://opentdb.com/api.php';
  const fetchUrl = `${baseUrl}?amount=${NUM_QUESTIONS}&category=${cat}&difficulty=${DIFFICULTY}`;
  try {
    const response = await fetch(fetchUrl + '&type=multiple');
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error(error);
    alert('Ha habido un problema conectando con la base de datos.');
    window.location.reload();
  }
}

async function getCloudQuestions() {


  try {
    const database = getDatabase(initializeApp(firebaseConfig));
    const snapshot = await get(ref(database, 'results'));

    return shuffle(snapshot.val());

  } catch (error) {
    console.error(error);
    alert('Ha habido un problema conectando con la base de datos.');
    window.location.reload();
  }
}

/* Fisher–Yates shuffle algorithm */
function shuffle(arr) {
  let currentIndex = arr.length;
  let randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
  }

  return arr;
}

function createChart() {
  const storedData = JSON.parse(localStorage.getItem('scores')) ?? [];
  if (storedData.length > 0) {
    document.getElementById('graph-section').style.display = 'block';
    const xValues = storedData.map(obj => obj.fullDate);
    const yValues = storedData.map(obj => obj.score);
    const barColors = "black";

    new Chart("myChart", {
      type: "bar",
      data: {
        labels: xValues,
        datasets: [{
          backgroundColor: barColors,
          data: yValues
        }]
      },
      options: {
        maintainAspectRatio: false,
        legend: { display: false },
        title: {
          display: true,
          text: "Últimos 10 resultados"
        },
        scales: {
          yAxes: [{
            display: true,
            ticks: {
              beginAtZero: true,
              max: NUM_QUESTIONS,
              stepSize: 1
            }
          }]
        }
      }
    });
  }
}