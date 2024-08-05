var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors')

// express app
var app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// session
var session = require('express-session')

var oneWeek = 1000 * 60 * 60 * 24 * 7
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'MyLovelyYaeMiko',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: oneWeek }
}))

// cookie parser
var cookieParser = require('cookie-parser')
app.use(cookieParser());

// jwt
const jwt = require('jsonwebtoken')
const secretKey = 'MyLovelyYaeMiko'

function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    console.log(token)
    if(token == null){
        return res.status(401).json({
            error: true,
            message: 'Unauthorized'
        })
    }
    jwt.verify(token, secretKey, (err, user)=>{
        if(err){
            return res.status(403).json({
                error: true,
                message: 'Forbidden'
            })
        }
        req.user = user
        next()
    }
)}

// routes
app.get('/', (req, res)=>{
    res.send(
        `<h1>API Documentation</h1>
        <a href='https://docs.google.com/document/d/1-Z3QRKcvuMldz4tEcqZT_bRQESzZsLHPJX9pkVELbG4/edit?usp=sharing'>GDocs</a>`
    )
})

// auth route
var auth = require('./router/auth.routes.js')
app.use(auth)
// profile route
// var profile = require('./route/profile')
var profile = require('./router/profile.routes.js')
app.use(profile)
// makanan route
var makanan = require('./router/makanan.routes.js')
app.use(makanan)
// riwayat_pencarian route
var riwayat_pencarian = require('./router/riwayat_pencarian.routes.js')
app.use(riwayat_pencarian)
// target_kalori route
var target_kalori = require('./router/target_kalori.routes.js')
app.use(target_kalori)
// asupan_harian route
var asupan_harian = require('./router/asupan_harian.routes.js')
app.use(asupan_harian)

// server
var port = process.env.PORT || 3000
app.listen(port, ()=>{
    console.log('Server berjalan di port ' + port)
})
