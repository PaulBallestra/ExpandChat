const express = require('express')
const helmet = require('helmet')
const bodyParser = require('body-parser')

const urlencoderParser = bodyParser.urlencoded({extended: false}) //pour récupèrer des formulaire html

const app = express()
app.use(helmet())
app.use(express.static('public'))

app.set('view engine', './views')

//SERVEUR SE LANCERA SUR LE PORT 3000
const port = 3000

//Racine du serveur
app.get('/', (req, res) => {
    app.locals.page = 'index'
    res.render('index.pug', {
        page: 'index'
    })
})

//SignUp (GET)
app.get('/signup', (req, res) => {
    app.locals.page = 'signup'
    res.render('signup.pug') //Affichage de la view du signup
})

//SignUp (POST)
app.post('/signup', urlencoderParser, (req, res) => {
    console.log('POST/signup -> req.body.pseudo:', req.body.pseudo)
    console.log('POST/signup -> req.body.email:', req.body.email)
    console.log('POST/signup -> req.body.password:', req.body.password)
    res.render('signup.pug')
})

//SignIn (GET)
app.get('/signin', (req, res) => {
    app.locals.page = 'signin'
    res.render('signin.pug') //Affichage de la view du signin
})

//SignIn (POST)
app.post('/signin', urlencoderParser, (req, res) => {
    console.log('POST/signin -> req.body.pseudo:', req.body.pseudo)
    console.log('POST/signin -> req.body.password:', req.body.password)
    res.render('signin.pug')
})

//Chat (GET)
app.get('/chat', (req, res) => {
    app.locals.page = 'chat'
    res.render('chat.pug') //Affichage de la view du signup
})

//Admin (GET)
app.get('/admin', (req, res) => {
    app.locals.page = 'admin'
    res.render('admin.pug') //Affichage de la view de l'admin
})

app.listen(port, () =>
    console.log(`le serveur express est lancé sur le port ${port}`)
)