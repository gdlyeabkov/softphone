const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const express = require('express')
const path = require('path')
const app = express()
const server = require('http').Server(app)
const io = require("socket.io")(server)
const serveStatic = require('serve-static')

const cors = require('cors')

const { ExpressPeerServer } = require('peer')
const peerServer = ExpressPeerServer(server, {
    debug: true
})

// app.use(express.json());
// app.use(express.urlencoded({extended: false}));
// app.use(
//     cors({
//         origin: "https://phonesoft.com",
//         optionsSuccessStatus: 200
//     })
// )

// const PeerServer = require('peer').PeerServer


var sockets = []
var rooms = []
var phones = []
var cursorOfConnection = -1
var indexConnection = 0
var peerIndex = 0
var lastpeer = ''
var countClientsInPeer = 0

peerServer.on('connection', (client) => {
    console.log(`client: ${client.id}`)  
    lastpeer = client.id
    countClientsInPeer++
})

peerServer.on('disconnect', (client) => {
    console.log(`client: ${client.id}`)
    
    // if(io.sockets.adapter.rooms.size === 0){
    //     cursorOfConnection = -1
    //     sockets = []
    //     rooms = []
    //     phones = []
    // }

    countClientsInPeer--
    if(countClientsInPeer === 0){
        cursorOfConnection = -1
        sockets = []
        rooms = []
        phones = []
    }
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

app.use('/', serveStatic(path.join(__dirname, '/dist')))

io.on('connection', (socket) => {
    indexConnection++
    sockets.push(socket)
    
    // if(0 < indexConnection - 1){
    //     sockets.pop()
    // }

    if(0 < indexConnection - 1){
        indexConnection--
    }

    if(Array.from(socket.rooms).length === indexConnection){
        console.log(`--------------------------------------`)
        sockets.map(socket => {
            console.log(`sockets.id: ${socket.id}`)
        })
        console.log(`--------------------------------------`)
        socket.on('disconnect', function() {
            
            let indexOfSocket = sockets.indexOf(socket)
            sockets.splice(indexOfSocket, 1)
            rooms.splice(indexOfSocket, 1)
            phones.splice(indexOfSocket, 1)
            
            if(sockets.length === 0){
                cursorOfConnection = -1
            }

            console.log(`io.sockets.adapter.rooms.size: ${io.sockets.adapter.rooms.size}`)
            console.log(`cursorOfConnection: ${cursorOfConnection}`)

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

app.get('/clean', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    // let indexOfSocket = sockets.indexOf(socket)
    let indexOfSocket = req.query.cursorofconnection

    sockets.splice(indexOfSocket, 1)
    rooms.splice(indexOfSocket, 1)
    phones.splice(indexOfSocket, 1)

    if(io.sockets.adapter.rooms.size === 0){
        cursorOfConnection = -1
        sockets = []
        rooms = []
        phones = []
    }
    
})

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
        
        // if(io.sockets.adapter.rooms.size <= 1){
        //     cursorOfConnection = -1
        // }
        
        cursorOfConnection++
        return res.json({ 'sockets': allSockets, 'phone': req.query.phone, cursorOfConnection: cursorOfConnection })

    })
})

// const port = process.env.PORT || 8080
const port = 4000 

// io.on('connection', (socket) => {
//     console.log("connection")
// })

app.get('/video', async (req, res)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    
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
    
    if(peerIndex <= 1){
        peerIndex++
    } else if(peerIndex === 2){
        peerIndex = 0
    }
    console.log(`peerIndex: ${peerIndex}`)
    
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
    console.log(`req.query.message: ${req.query.message}`)
    console.log(`req.query.msgcolor: ${req.query.msgcolor}`)
    console.log(`req.query.phone: ${req.query.phone}`)
    console.log(`req.query.room: ${req.query.room}`)
    console.log(`req.query,cursorofconnection: ${req.query.cursorofconnection}`)
    console.log(`req.query.phone: ${req.query.phone}`)
    console.log(`rooms: ${rooms}`)
    console.log(`phones: ${phones}`)
    console.log(`idxConnection: ${rooms.findIndex(
        (el, index, array) => {
            if(el === req.query.phone && phones.some(phone => {
                return phone === req.query.room
            })){
                console.log(`el: ${el}`)
                return true
            } else if(el !== req.query.phone){
                return false
            } else {
                return false
            }
        }
    )}`)
    io.to(sockets[req.query.cursorofconnection].id).emit('sendMessage', req.query.message, req.query.msgcolor)
    // io.emit('sendMessage', req.query.message, req.query.msgcolor)
    let idxConnection = rooms.findIndex(
        (el, index, array) => {
            if(el === req.query.phone && phones.some(phone => {
                return phone === req.query.room
            })){
                return true
            } else if(el !== req.query.phone){
                return false
            } else {
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
        if(idxAlertConnection >= 0){
            io.to(sockets[idxAlertConnection].id).emit('alertMessage', req.query.message)
        }
    }
    return res.json({ status: "OK" })
})

app.get('/create', (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    new SocketModel({ id: req.query.socketid, phone: req.query.phonenumber }).save(function (err) {
        if(err) {
            return res.json({ 'status': 'Error' })
        }
        return res.json({ 'status': 'OK' })
    })
})

app.get('**', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, X-Access-Token, X-Socket-ID, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    
    // return res.redirect(`http://localhost:4000/?redirectroute=${req.path}`)
    return res.redirect(`https://phonesoft.herokuapp.com/?redirectroute=${req.path}`)

})

server.listen(port)