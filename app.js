'use strict';

const express = require('express')
const helmet = require('helmet')
const bodyParser = require('body-parser')

const urlencoderParser = bodyParser.urlencoded({extended: false}) //pour récupèrer des formulaire html

//Import table USER
const { User } = require('./models')
const { Op } = require('sequelize') //Operateur pour les futures requetes

//Chargement de PassportJS
const passport = require('passport')
const session = require('express-session')
const LocalStrategy = require('passport-local').Strategy

const {emailRegex, usernameRegex, passwordRegex} = require('./helpers/regex')

const app = express()
app.use(helmet())
app.use(express.static('public'))

app.set('view engine', './views')

app.locals.isConnected = false


//SERVEUR SE LANCERA SUR LE PORT 4002
const port = 4002; //PORT POUVANT ETRE UTILISES - 4000 à 4009


//cimmmentei
app.use(
    session({
        secret: 'unephrasetressecrete',
        resave: false,
        saveUninitialized: false
    })
)

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((user, done) => {
    done(null, user)
})

//Stratégie
passport.use(
    new LocalStrategy(
        async (username, password, done) => {
            try{

                const user = await User.findOne({
                    where: {username}
                })

                //vérification si l'user existe + si sont mdp est le bon si il existe
                if(!user || (user.password !== password))
                    return done(null, false, {
                        success: false,
                        message: 'Mauvais identifiants'
                    })

                app.locals.user = user
                app.locals.isConnected = true
                return done(null, user)

            }catch(error){
                if (error) return done(error)
            }
        }
    )
)


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

//Log Out
app.get('/logout', (req, res) => {
    req.logout()
    app.locals.isConnected = false
    res.redirect('/')
})

//SignUp (POST)
app.post('/signup', urlencoderParser, async (req, res) => {

    try{

        console.log('POST/signup -> req.body.username:', req.body.username)
        console.log('POST/signup -> req.body.email:', req.body.email)
        console.log('POST/signup -> req.body.password:', req.body.password)

        const {email, password, username} = req.body

        //Vérification que l'email de l'user est conforme à l'expression régulière
        if(!email.match(emailRegex)){
            return res.status(400).render('signup.pug', {
                alert: {
                    success: false,
                    message: 'Votre email n\'est pas valide.'
                },
                saved: {
                    username: req.body.username
                }

            }) //retour sur la page de signup avec des paramètres
        }

        //Vérification que l'username de l'user est correct (pas moin de 2 caractères)
        if(!username.match(usernameRegex)){
            return res.status(400).render('signup.pug', {
                alert: {
                    success: false,
                    message: 'Votre username n\'est pas valide. (2 caracères ou +)'
                },
                saved: {
                    email: req.body.email
                }
            }) //retour sur la page de signup avec des paramètres
        }

        //Vérification du mdp
        if(!password.match(passwordRegex)){
            return res.status(400).render('signup.pug', {
                alert: {
                    success: false,
                    message: 'Votre mot de passe n\'est pas valide. (4 chiffres)'
                },
                saved: {
                    username: req.body.username,
                    email: req.body.email,
                }
            }) //retour sur la page de signup avec des paramètres
        }

        //Enregistrer un nouvel user
        const [user, created] = await User.findOrCreate({
            where: {[Op.or]: [{username}, {email}]},
                defaults: {
                    username,
                    email,
                    password,
                    isAdmin: false
                }
        })

        if(!created){

            return res.status(400).render('signup.pug', {
                alert: {
                    success: false,
                    message: 'Votre email ou pseudo est déjà utilisé.'
                }
            })
        }

        console.log('POST/signup -> user créé : ', user)
        res.status(200).render('signin.pug', {
            alert: {
                success: true,
                message: 'Votre compte a bien été créé ! Connectez-vous !'
            }
        })

    }catch(error){
        console.log('Error POST/signup : ', error)
        res.status(500).render('500.pug')
    }
})

//CONNEXION
//SignIn (GET)
app.get('/signin', (req, res) => {
    app.locals.page = 'signin'
    res.status(200).render('signin.pug') //Affichage de la view du signin
})

//SignIn (POST)
app.post('/signin', urlencoderParser, passport.authenticate('local', {
    successRedirect: '/chat',
    failureRedirect: '/signin'
}))

//CHAT
//Chat (GET)
app.get('/chat', (req, res) => {

    //si il n'est pas connecté on le renvoit vers la page de connexion
    if(!app.locals.isConnected){
        app.locals.page = 'signin'
        res.status(200).render('signin.pug', {
            alert: {
                success: false,
                message: 'Vous devez vous connecter avant de pouvoir aller sur cet onglet.'
            }
        })

    }

    app.locals.page = 'chat'

    res.status(200).render('chat.pug', {
        alert: {
            success: true,
            message: 'Vous êtes connecté !'
        }
    })

})

//PROFILE
app.get('/admin/:userId', async (req, res) => {

    app.locals.page = 'admin'

    const userId = req.params.userId
    const user = await User.findByPk(userId)

    if(user){
        res.status(200).render('profile.pug', user) //redirection
    }else{
        res.status(400).render('chat.pug', {
            alert: {
                success: false,
                message: 'Ce compte n\'est pas le vôtre, vous ne pourrez donc pas le modifier !'
            }
        })
    }

})

//Si il a lancé l'update, on vérifie ce qu'il a mit
app.post('/admin/:userId', urlencoderParser, async (req, res) => {

    const {email, password, username} = req.body
    const userId = req.params.userId

    //Vérif de l'email
    if(!email.match(emailRegex)){
        res.status(400).render('profile.pug', {
            alert: {
                success: false,
                message: 'Votre email n\'est pas valide.'
            }
        }) //retour sur la page de signup avec des paramètres
    }

    //Vérification que l'username de l'user est correct (pas moin de 2 caractères)
    if(!username.match(usernameRegex)){
        res.status(400).render('profile.pug', {
            alert: {
                success: false,
                message: 'Votre username n\'est pas valide. (2 caracères ou +)'
            }
        }) //retour sur la page de signup avec des paramètres
    }

    //Si les test sont passés, on l'insére en base de donnée
    const user = await User.findByPk(userId)

    user.username = username
    user.email = email

    //Si il ne touche pas au mdp on ne le modifie pas
    if(password !== ''){

        //Vérification du mdp
        if(!password.match(passwordRegex)){
            return res.status(400).render('profile.pug', {
                alert: {
                    success: false,
                    message: 'Votre mot de passe n\'est pas valide. (4 chiffres)'
                },
                saved: {
                    username: username,
                    email: email,
                }
            }) //retour sur la page de signup avec des paramètres
        }

        user.password = password
    }


    await user.save() //maj

    res.status(200).render('profile.pug', {
        alert: {
            success: true,
            message: 'Votre profil a été mis à jour.'
        }
    }) //retour sur la page de signup avec des paramètres

})


//Admin (GET)
app.get('/admin', async (req, res) => {

    console.log(req.user)

    //Delete
    /*User.destroy({
        where: {},
        truncate: true
    })*/

    //Vérif si l'user est bien un admin
    if(!app.locals.isConnected && req.user.isAdmin !== true){
        app.locals.page = 'signin'
        return res.redirect('/signin')
    }

    //Si l'user veut acceder au panel d'admin, il est redirigé sur le sien
    if(!req.user.isAdmin){
        app.locals.page = 'admin'
        res.status(200).render('/admin/' + req.user.id, {
            alert: {
                success: false,
                message: 'Vous n\'avez pas accès à cette page !'
            }
        })
    }

    //si il est bien admin on lance l'affichage de tous les users
    try{

        const users = await User.findAll()
        app.locals.page = 'admin'
        res.status(200).render('admin.pug', {users}) //Affichage de la view de l'admin

    }catch (error){
        app.locals.page = 'admin'
        res.status(500).render('500.pug') //Affichage de l'erreur
    }


})

//DELETE
app.get('/delete/:userId', async(req, res) => {

    const userId = req.params.userId
    const user = await User.findByPk(userId)

    user.destroy()

    const users = await User.findAll()

    res.status(200).render('admin.pug', {
        users,
        alert: {
            success: true,
            message: 'Votre utilisateur a bien été supprimé'
        }
    })

})

app.listen(port, () =>
    console.log(`le serveur express est lancé sur le port ${port}`)
)