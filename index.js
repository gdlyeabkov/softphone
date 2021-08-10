const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const express = require('express')
const path = require('path')
const app = express()
const server = require('http').Server(app)
const io = require("socket.io")(server)
const serveStatic = require('serve-static')
const { ExpressPeerServer } = require('peer')
const peerServer = ExpressPeerServer(server, {
    debug: true
})

var mysocket = null
var sockets = []
var rooms = []
var phones = []
var cursorOfConnection = -1
var indexConnection = 0
var peerIndex = 0
var lastpeer = ''

peerServer.on('connection', (client) => {
    console.log(`client: ${client.id}`)  
    lastpeer = client.id
})

peerServer.on('disconnect', (client) => {
    console.log(`client: ${client.id}`)
})
app.use('/peerjs', peerServer)

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
    phone: String
}, { collection : 'mysockets' });

const SocketModel = mongoose.model('SocketModel', SocketSchema);

app.use('/', [serveStatic(path.join(__dirname, '/dist')),
    (req, res, next) => {
        indexConnection = 0
        io.on('connection', (socket) => {
            indexConnection++
            sockets.push(socket)
            
            if(0 < indexConnection - 1){
                sockets.pop()
            }
            if(Array.from(socket.rooms).length === indexConnection){
                console.log(`--------------------------------------`)
                sockets.map(socket => {
                    console.log(`sockets.id: ${socket.id}`)
                })
                console.log(`--------------------------------------`)
                // sockets[sockets.length - 1].data.phone = req.params.room
                socket.on('disconnect', function() {
                    let indexOfSocket = sockets.indexOf(socket)
                    sockets.splice(indexOfSocket, 1)
                    rooms.splice(indexOfSocket, 1)
                    phones.splice(indexOfSocket, 1)
                    cursorOfConnection--
                    console.log(`--------------------------------------`)
                    sockets.map(socket => {
                        console.log(`sockets.id: ${socket.id}`)
                    })
                    rooms.map((room, roomIndex) => {
                        console.log(`rooms[${roomIndex}]: ${rooms[roomIndex]}`)
                    })
                    console.log(`--------------------------------------`)
                })
            }
        })
        return next()
    }
])

app.get('/sockets', (req, res) => {
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    // io.on('connection', (socket) => {
    //     console.log("connection")
    // })

    let query = SocketModel.find({  })
    query.exec((err, allSockets) => {
        if (err){
            return res.json({ 'sockets': [], 'phone': req.query.phone  })    
        }
        allSockets = allSockets.filter(socket => {
            return !req.query.phone.includes(socket.phone) 
        })
        
        // return res.json({ 'sockets': allSockets, 'phone': req.query.phone })
        cursorOfConnection++
        return res.json({ 'sockets': allSockets, 'phone': req.query.phone, cursorOfConnection: cursorOfConnection })

    })
})

const port = process.env.PORT || 8080
// const port = 4000

io.on('connection', (socket) => {
    console.log("connection")
})

app.get('/video', async (req, res)=>{
    console.log(`req.query.phone: ${req.query.phone}`)
    console.log(`rooms: ${rooms}`)
    console.log(`lastpeer: ${lastpeer}`)
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
        io.to(sockets[idxConnection].id).emit('receiveVideoStream', lastpeer)
    } else if(idxConnection <= -1){
        return res.json({ status: "Error" })
    }
    return res.json({ status: "OK" })
})


app.get('/room/:room', (req, res) => {
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    
    peerIndex++
    phones.push(req.query.phone)
    rooms.push(req.params.room)
    // cursorOfConnection++
    // let query = SocketModel.findOne({ 'phone': req.params.room })
    // query.exec((err, otherSocket) => {
    //     if(err) {
    //         return
    //     }
    //     let reqQueryPhone = otherSocket.phone
    //     io.on('connection', (socket) => {
    //         indexConnection = 0
    //         // let reqQueryPhone = otherSocket.phone
        
    //         indexConnection++
    //         sockets.push(socket)
            
    //         if(0 < indexConnection - 1){
    //             sockets.pop()
    //         }
    //         if(Array.from(socket.rooms).length === indexConnection){
    //             console.log(`--------------------------------------`)
    //             sockets.map(socket => {
    //                 console.log(`sockets.id: ${socket.id}`)
    //             })
    //             console.log(`--------------------------------------`)
    //             // sockets[sockets.length - 1].data.phone = req.params.room
    //             socket.on('disconnect', function() {
    //                 let indexOfSocket = sockets.indexOf(socket)
    //                 sockets.splice(indexOfSocket, 1)
    //                 rooms.splice(indexOfSocket, 1)
    //                 phones.splice(indexOfSocket, 1)
    //                 cursorOfConnection--
    //                 console.log(`--------------------------------------`)
    //                 sockets.map(socket => {
    //                     console.log(`sockets.id: ${socket.id}`)
    //                 })
    //                 rooms.map((room, roomIndex) => {
    //                     console.log(`rooms[${roomIndex}]: ${rooms[roomIndex]}`)
    //                 })
    //                 console.log(`--------------------------------------`)
    //             })
    //             SocketModel.updateOne({ phone: reqQueryPhone }, {
    //                 $set: {
    //                     "id": sockets[sockets.length - 1].id
    //                 }
    //             }, (err, updatedSocket) => {
    //                 if(err) {
                        
    //                 }
                    
    //             })
    //         }
    //     })
    
    // })
    
    // return res.json({ roomId: rooms[cursorOfConnection], phone: req.query.phone, cursorOfConnection: cursorOfConnection, port: port, peer: lastpeer, peerindex: peerIndex  })
    return res.json({ port: port, peer: lastpeer, peerindex: peerIndex  })

})


app.get('/send', async (req, res) => {
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    
    console.log(`req.query: ${Object.keys(req.query)}`)
    console.log(`req.query: ${req.query.message}`)
    console.log(`req.query: ${req.query.msgcolor}`)
    console.log(`req.query: ${req.query.phone}`)
    console.log(`req.query: ${req.query.room}`)
    console.log(`req.query: ${req.query.cursorofconnection}`)
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
    io.to(sockets[req.query.cursorofconnection].id).emit('sendMessage', req.query.message, req.query.msgcolor)
    // io.emit('sendMessage', req.query.message, req.query.msgcolor)
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
                if(el === rooms[req.query.cursorofconnection]){
                    return true
                } else if(el !== rooms[req.query.cursorofconnection]){
                    return false
                }
            }
        )
        console.log(`idxAlertConnection: ${idxAlertConnection}`)
        io.to(sockets[idxAlertConnection].id).emit('alertMessage', req.query.message)
    }
    return res.json({ status: "OK" })
})

server.listen(port)