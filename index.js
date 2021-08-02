const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
const express = require('express')
const serveStatic = require('serve-static')
const app = express()
const server = require('http').Server(app)
const { ExpressPeerServer } = require('peer')
const peerServer = ExpressPeerServer(server, {
    debug: true
})

app.use('/', serveStatic(path.join(__dirname, '/dist')))

const url = `mongodb+srv://glebClusterUser:glebClusterUserPassword@cluster0.fvfru.mongodb.net/sockets?retryWrites=true&w=majority`;

const SocketSchema = new mongoose.Schema({
    id: String,
}, { collection : 'mysockets' });

const SocketModel = mongoose.model('SocketModel', SocketSchema);

app.get('/create', (req, res) => {
    new SocketModel({ id: req.query.socketid }).save(function (err) {
        if(err) {
            return res.json({ 'status': 'Error' })
        }
        return res.json({ 'status': 'OK' })
    })
})

app.get('/get', (req, res) => {
    let query = SocketModel.find({  })
    query.exec((err, allSockets) => {
        if (err){
            return res.json({ 'status': 'Error', 'ids': [] })
        }
        return res.json({ 'status': 'OK', 'ids': allSockets })
    })
})

// const port = process.env.PORT || 8080
const port = 4000
app.listen(port)