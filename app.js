const express = require('express')
const helmet = require('helmet')
const bodyParser = require('body-parser')

const urlencoderParser = bodyParser.urlencoded({extended: false}) //pour récupèrer des formulaire html

//Import table USER
const {User} = require('./models')
const {Op} = require('sequelize') //Operateur pour les futures requetes

const app = express()
app.use(helmet())
app.use(express.static('public'))

app.set('view engine', './views')

//SERVEUR SE LANCERA SUR LE PORT 3000
const port = 3000

//Racine du serveur
app.get('/', (req, res) => {
    app.locals.page = 'index'
    res.status(200).render('index.pug')
})

//SignUp (GET)
app.get('/signup', (req, res) => {
    app.locals.page = 'signup'
    res.status(200).render('signup.pug') //Affichage de la view du signup
})

//SignUp (POST)
app.post('/signup', urlencoderParser, async (req, res) => {

    console.log('eriefeoirhf{')

    try{

        console.log('POST/signup -> req.body.username:', req.body.username)
        console.log('POST/signup -> req.body.email:', req.body.email)
        console.log('POST/signup -> req.body.password:', req.body.password)

        const {email, password, username} = req.body

        //Enregistrer un nouvel user
        const [user, created] = await User.findOrCreate({
            where: {[Op.or]: [{username}, {email}]},
                defaults: {
                    username,
                    email,
                    password,
                    isAdmin: true
                }
        })
        if(!created){
            return res.status(400).render('signup/pug')
        }

        console.log('POST/signup -> user créé : ', user)
        res.status(200).render('signup.pug')

    }catch(error){

        console.log('Error POST/signup : ', error)
        res.status(500).render('500.pug')

    }
})

//SignIn (GET)
app.get('/signin', (req, res) => {
    app.locals.page = 'signin'
    res.status(200).render('signin.pug') //Affichage de la view du signin
})

//SignIn (POST)
app.post('/signin', urlencoderParser, (req, res) => {
    console.log('POST/signin -> req.body.username:', req.body.username)
    console.log('POST/signin -> req.body.password:', req.body.password)
    res.status(200).render('signin.pug')
})

//Chat (GET)
app.get('/chat', (req, res) => {
    app.locals.page = 'chat'
    res.status(200).render('chat.pug') //Affichage de la view du signup
})

//Admin (GET)
app.get('/admin', async (req, res) => {

    try{

        const users = await User.findAll()
        console.log(users)
        app.locals.page = 'admin'
        res.status(200).render('admin.pug', {users}) //Affichage de la view de l'admin

    }catch (error){
        console.log(error)
        app.locals.page = 'admin'
        res.status(500).render('500.pug') //Affichage de l'erreur
    }


})

app.listen(port, () =>
    console.log(`le serveur express est lancé sur le port ${port}`)
)