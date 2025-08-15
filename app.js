// --- DEMO DATA LOADING ---
const demoBooks = [
  { isbn: "9780143127550", title: "Book One", author: "Author One", reviews: [] },
  { isbn: "9780671027032", title: "Book Two", author: "Author Two", reviews: [] }
];
if(!localStorage.books) localStorage.books = JSON.stringify(demoBooks);
if(!localStorage.users) localStorage.users = JSON.stringify([]);
if(!localStorage.sessions) localStorage.sessions = JSON.stringify({});

function saveBooks(books) { localStorage.books = JSON.stringify(books); }
function loadBooks() { return JSON.parse(localStorage.books); }
function saveUsers(users) { localStorage.users = JSON.stringify(users); }
function loadUsers() { return JSON.parse(localStorage.users); }
function saveSessions(sessions) { localStorage.sessions = JSON.stringify(sessions); }
function loadSessions() { return JSON.parse(localStorage.sessions); }

let loggedInUser = localStorage.loggedInUser || null;

window.onload = function() {
  updateNav();
  if (loggedInUser && loadSessions()[loggedInUser]) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    listBooks();
  }
};

// === AUTH LOGIC ===
function register() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  let users = loadUsers();
  let msg = document.getElementById('authMsg');
  if(!username || !password) {
    msg.textContent = "Please enter all fields."; msg.className = "msg error"; return;
  }
  if(users.some(u => u.username === username)) {
    msg.textContent = "User already exists."; msg.className = "msg error"; return;
  }
  users.push({username, password});
  saveUsers(users);
  msg.textContent = "Registration successful! Now login.";
  msg.className = "msg success";
}
function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  let users = loadUsers();
  let user = users.find(u => u.username === username && u.password === password);
  let msg = document.getElementById('authMsg');
  if(!user) { msg.textContent = "Invalid credentials."; msg.className = "msg error"; return; }
  loggedInUser = username;
  localStorage.loggedInUser = username;
  let sessions = loadSessions(); sessions[username] = true; saveSessions(sessions);
  msg.textContent = "Logged in!";
  msg.className = "msg success";
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('app-section').classList.remove('hidden');
  updateNav();
  listBooks();
}
function logout() {
  if(loggedInUser) {
    let sessions = loadSessions(); delete sessions[loggedInUser]; saveSessions(sessions);
    localStorage.removeItem('loggedInUser');
    loggedInUser = null;
    updateNav();
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('app-section').classList.add('hidden');
    document.getElementById('authMsg').textContent = "Logged out.";
    document.getElementById('authMsg').className = "msg";
  }
}
function updateNav() {
  let navAuth = document.getElementById('nav-auth');
  navAuth.innerHTML = loggedInUser
    ? `<span>👋 <b>${loggedInUser}</b> <button onclick="logout()" class="btn">Logout</button>`
    : '<span>Not logged in</span>';
}

// === CRUD & UI LOGIC ===
function listBooks() {
  let books = loadBooks();
  showBookList(books);
  document.getElementById('searchValue').value = "";
}

function searchBooks() {
  const val = document.getElementById('searchValue').value.trim().toLowerCase();
  let books = loadBooks();
  if(val==='') { showBookList(books); return; }
  let result = books.filter(
    b => b.isbn.toLowerCase() === val
      || b.author.toLowerCase().includes(val)
      || b.title.toLowerCase().includes(val)
  );
  showBookList(result);
}

function showBookList(books) {
  const div = document.getElementById('booksList');
  if(!books.length) { div.innerHTML = "<em>No books found.</em>"; return; }
  div.innerHTML = books.map(b=>`
    <div class="book-card">
      <div><strong>${b.title}</strong> <span class="book-meta">by ${b.author}</span></div>
      <div class="book-meta">ISBN: ${b.isbn}</div>
      <div class="book-actions">
        <button class="btn" onclick="showBookDetail('${b.isbn}')">View Details & Reviews</button>
      </div>
    </div>
  `).join('');
  document.getElementById('reviewsList').innerHTML = '';
  document.getElementById('bookDetail').innerHTML = '';
  document.getElementById('reviewForm').classList.add("hidden");
}

function showBookDetail(isbn) {
  if(!isbn){ 
    document.getElementById('bookDetail').innerHTML = '';
    document.getElementById('reviewsList').innerHTML = '';
    document.getElementById('reviewForm').classList.add('hidden');
    return;
  }
  const books = loadBooks();
  const book = books.find(b=>b.isbn===isbn);
  if(!book){ return; }
  document.getElementById('bookDetail').innerHTML =
    `<h2>${book.title}</h2>
    <div class="book-meta">by <b>${book.author}</b> &middot; ISBN: ${book.isbn}</div>`;
  // Reviews
  renderReviews(isbn);
}

function renderReviews(isbn){
  const books = loadBooks();
  const book = books.find(b=>b.isbn===isbn);
  let html = `<h3>Reviews:</h3>`;
  if(!book.reviews.length) html += "<i>No reviews yet.</i>";
  else {
    html += book.reviews.map(r=>
      `<div class="review-item"><span class="review-author">${r.user}</span>:<br>${r.comment}</div>`
    ).join('');
  }
  document.getElementById('reviewsList').innerHTML = html;
  // Show review form if logged in
  if(loggedInUser){
    document.getElementById('reviewForm').classList.remove('hidden');
    document.getElementById('reviewText').value = (book.reviews.find(r=>r.user===loggedInUser)||{}).comment||"";
    document.getElementById('reviewForm').setAttribute("data-using", isbn);
  } else {
    document.getElementById('reviewForm').classList.add('hidden');
  }
}

function submitReview(){
  const isbn = document.getElementById('reviewForm').getAttribute("data-using");
  let text = document.getElementById('reviewText').value.trim();
  if(!text){ alert("Please enter your review text."); return; }
  let books = loadBooks(); let book = books.find(b=>b.isbn===isbn);
  if(!book) return;
  let idx = book.reviews.findIndex(r=>r.user===loggedInUser);
  if(idx>=0) book.reviews[idx].comment = text;
  else book.reviews.push({user: loggedInUser, comment: text});
  saveBooks(books);
  renderReviews(isbn);
  alert("Review saved!");
}

function deleteReview(){
  const isbn = document.getElementById('reviewForm').getAttribute("data-using");
  let books = loadBooks(); let book = books.find(b=>b.isbn===isbn);
  if(!book) return;
  book.reviews = book.reviews.filter(r=>r.user !== loggedInUser);
  saveBooks(books);
  renderReviews(isbn);
  document.getElementById('reviewText').value = "";
  alert("Review deleted!");
}

// Async/Await/Promise example for demo (see browser console)
async function getAllBooksAsync(){
  return new Promise(resolve => setTimeout(()=>resolve(loadBooks()),150));
}
async function searchBookByISBNAsync(isbn){
  return new Promise(resolve => {
    setTimeout(()=>resolve(loadBooks().find(b=>b.isbn===isbn)), 120);
  });
}
function searchBookByAuthorPromise(author){
  return new Promise(resolve=>{
    setTimeout(()=>resolve(loadBooks().filter(b=>b.author.toLowerCase().includes(author.toLowerCase()))),130);
  });
}
function searchBookByTitlePromise(title){
  return new Promise(resolve=>{
    setTimeout(()=>resolve(loadBooks().filter(b=>b.title.toLowerCase().includes(title.toLowerCase()))),130);
  });
}
window.demoAsync = async function(){
  console.log("All books:", await getAllBooksAsync());
  console.log("Search by ISBN:", await searchBookByISBNAsync("9780143127550"));
  searchBookByAuthorPromise("One").then(console.log);
  searchBookByTitlePromise("Book").then(console.log);
}
