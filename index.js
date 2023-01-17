const express = require('express');
const bodyparser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config()

const WebSocket = require('ws');
const app = express();

app.use(cors());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());


let socket= null;
let allowed_requests = 5;

var wss = new WebSocket.Server({port: 3002});
wss.broadcast = function broadcastMsg(msg) {
   console.log(msg);
}

wss.on('connection', function connection(ws, request, client) {
    console.log('Connected to websocket');    
    ws.on('connection', function connection(ws){    
        ws.on('message', wss.broadcast);
    })      
});

app.get('/proceso', async (req, res) => {    
    let token = req.headers.authorization;
    socket = new WebSocket("ws://localhost:3002/ws");
    verifier(token, res);    
   
});

app.post('/envio',  (req, res) => {
    if(allowed_requests > 0){
        allowed_requests--;
        socket.send("Test");        
    }else{
        logged_token = jwt.sign({           
        }, process.env.TOKEN_SECRET, {
            expiresIn: '1'
        })
    }
})
app.post('/login', async (req, res) => {    
    logged_token = jwt.sign({
        name: req.body.name,
        id: req.body.id
    }, process.env.TOKEN_SECRET, {
        expiresIn: '10m'
    })    
    res.header('auth-token', logged_token).json({
        error: null,
        data: {logged_token}
    })
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`servidor andando en: ${PORT}`)
})

async function fetches(auth_token){
    const options = {
        method: 'POST',    
        headers: {
            'Authorization': auth_token
        }   
    };
    await fetch('http://localhost:3001/envio', options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));
}

function verifier(token, res){
    if(token){
        jwt.verify(
            token.split(' ')[1] , process.env.TOKEN_SECRET , (err) =>{
                if(!err){                    
                    fetches(token);
                    res.json({
                        estado: true,
                        mensaje: 'funciona!',           
                    })
                } else{
                    res.json({
                        Error: "Not Authorized"
                    })
                }
            }
        )
        }else res.json({
            Error: 'Empty authorization'
        })        
}