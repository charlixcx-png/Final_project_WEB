const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const usersFile = path.join(__dirname, 'users.json'); 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'mi_secreto_super_seguro',
    resave: false,
    saveUninitialized: true
}));

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

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login', { error: null }); 
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();

    const user = users.find(u => u.username === username);
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

app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();

    const userExists = users.some(u => u.username === username);
    if (userExists) {
        return res.redirect('/register?error=El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ 
        username, 
        password: hashedPassword, 
        totalPoints: 0, 
        crosswordPoints: 0 
    });
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
    console.log('Datos recibidos:', req.body);
    const { points } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.username === req.session.user);

    if (user) {
        console.log('Usuario encontrado:', user);

        const crosswordPoints = Math.max(user.crosswordPoints || 0, parseInt(points, 10));

        user.crosswordPoints = crosswordPoints;
        user.totalPoints = (user.totalPoints || 0) + (crosswordPoints - (user.crosswordPoints || 0));

        req.session.points = user.totalPoints;
        saveUsers(users);

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
    req.session.destroy(() => {
        console.log('Sesión destruida. Redirigiendo a login...');
        res.redirect('/login');
    });
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
            console.error('Error al destruir la sesión:', err);
            return res.status(500).send('Error interno del servidor.');
        }

        res.redirect('/register'); 
    });
});

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
