const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fs = require('fs');
require('dotenv').config();  // Para cargar variables de entorno

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'default_secret';  // Cargar clave secreta de entorno

const usersFile = path.join(__dirname, 'users.json'); 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Funciones auxiliares
function loadUsers() {
    if (!fs.existsSync(usersFile)) {
        fs.writeFileSync(usersFile, JSON.stringify([])); 
    }
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2)); 
}

function findUserByUsername(username) {
    const users = loadUsers();
    return users.find(u => u.username === username);
}

// Rutas
app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = findUserByUsername(username);

    if (!user) {
        return res.redirect('/login?error=Usuario o contraseña incorrectos');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (validPassword) {
        req.session.user = username;
        req.session.points = user.points || 0; 
        return res.redirect('/index');
    } else {
        return res.redirect('/login?error=Usuario o contraseña incorrectos');
    }
});

app.get('/register', (req, res) => res.render('register', { error: null }));

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const userExists = findUserByUsername(username);
    if (userExists) {
        return res.redirect('/register?error=El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const users = loadUsers();
    users.push({ username, password: hashedPassword, totalPoints: 0, crosswordPoints: 0 });
    saveUsers(users);

    return res.redirect('/login');
});

app.get('/index', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const users = loadUsers();
    const user = users.find(u => u.username === req.session.user);

    if (user) {
        res.render('index', { 
            user: req.session.user, 
            points: user.totalPoints || 0,
            crosswordPoints: user.crosswordPoints || 0 
        });
    } else {
        res.redirect('/login');
    }
});


app.post('/update-points', (req, res) => {
    const { points } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.username === req.session.user);

    if (user) {
        // Se asegura que los puntos del crucigrama sean los más altos entre los que ya tiene
        const crosswordPoints = Math.max(user.crosswordPoints || 0, parseInt(points, 10));
        user.crosswordPoints = crosswordPoints;

        // Se actualizan los puntos totales
        user.totalPoints = (user.totalPoints || 0) + crosswordPoints;

        // Actualizamos la sesión con los nuevos puntos
        req.session.points = user.totalPoints;
        req.session.crosswordPoints = user.crosswordPoints;

        saveUsers(users);  // Guardamos el archivo con los puntos actualizados

        res.json({
            success: true,
            totalPoints: user.totalPoints,
            crosswordPoints: user.crosswordPoints
        });
    } else {
        console.error('Usuario no encontrado:', req.session.user);
        res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
});


app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

app.post('/delete-account', (req, res) => {
    if (!req.session.user) {
        return res.status(403).send('No tienes permiso para realizar esta acción.');
    }

    const users = loadUsers();
    const updatedUsers = users.filter(user => user.username !== req.session.user);

    if (users.length === updatedUsers.length) {
        return res.status(404).send('Usuario no encontrado.');
    }

    saveUsers(updatedUsers);
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error interno del servidor.');
        }
        res.redirect('/register'); 
    });
});

// Juegos
app.get('/crossword', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('crossword'); 
});

app.get('/quiz', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('quiz');
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
