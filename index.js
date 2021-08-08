const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
const path = require('path')
const express = require('express')
const serveStatic = require('serve-static')
const app = express()
const server = require('http').Server(app)
const io = require("socket.io")(server)

var mysocket = null
var sockets = []
var rooms = []
var phones = []
var cursorOfConnection = -1
var indexConnection = 0

app.use('/', serveStatic(path.join(__dirname, '/dist')))

const url = `mongodb+srv://glebClusterUser:glebClusterUserPassword@cluster0.fvfru.mongodb.net/sockets?retryWrites=true&w=majority`;

const connectionParams = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true 
}

mongoose.connect(url, connectionParams)
    .then( () => {
        console.log('Connected to database ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. \n${err}`);
    })


const SocketSchema = new mongoose.Schema({
    id: String,
}, { collection : 'mysockets' });

const SocketModel = mongoose.model('SocketModel', SocketSchema);

app.get('/sockets', (req, res) => {
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    let query = SocketModel.find({  })
    query.exec((err, allSockets) => {
        if (err){
            return res.json({ 'sockets': [], 'phone': req.query.phone  })    
        }
        allSockets = allSockets.filter(socket => {
            return !req.query.phone.includes(socket.phone) 
        })
        
        return res.json({ 'sockets': allSockets, 'phone': req.query.phone })
    })
})

app.get('/room/:room', (req, res) => {
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    
    phones.push(req.query.phone)
    rooms.push(req.params.room)
    cursorOfConnection++
    let query = SocketModel.findOne({ 'phone': req.params.room })
    query.exec((err, otherSocket) => {
        if(err) {
            return
        }
        indexConnection = 0
        let reqQueryPhone = otherSocket.phone
        
        //... 
    
    })
    return res.json({ roomId: rooms[cursorOfConnection], phone: req.query.phone, cursorOfConnection })
})

io.on('connection', (socket) => {
    console.log('connection')
    socket.emit('clientsocket')
    socket.on('disconnect', function() {
        console.log('disconnect')
    })
})

app.get('/send', async (req, res)=>{
    console.log(`req.query.phone: ${req.query.phone}`)
    console.log(`rooms: ${rooms}`)
    console.log(`phones: ${phones}`)
    console.log(`index: ${rooms.findIndex(
        (el, index, array) => {
            if(el === req.query.phone){
                console.log(`el: ${el}`)
                return true
            } else if(el !== req.query.phone){
                return false
            }
        }
    )}`)
    io.to(sockets[req.query.cursorOfConnection].id).emit('sendMessage', req.query.message, req.query.msgcolor)
    let idxConnection = rooms.findIndex(
        (el, index, array) => {
            if(el === req.query.phone){
                return true
            } else if(el !== req.query.phone){
                return false
            }
        }
    )
    if(idxConnection >= 0){
        io.to(sockets[idxConnection].id).emit('sendMessage', req.query.message, req.query.msgcolor)
    } else if(idxConnection <= -1){
        let idxAlertConnection = phones.findIndex(
            (el, index, array) => {
                if(el === rooms[req.query.cursorOfConnection]){
                    return true
                } else if(el !== rooms[req.query.cursorOfConnection]){
                    return false
                }
            }
        )
        console.log(`idxAlertConnection: ${idxAlertConnection}`)
        io.to(sockets[idxAlertConnection].id).emit('alertMessage', req.query.message)
    }
    return res.json({ status: "OK" })
})

// const port = process.env.PORT || 4000
const port = 4000

app.listen(port)