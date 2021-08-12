<template>
  <div>
    <div style="display: flex; flex-direction: row; justify-content: center;">
      <video id="myvideo" width="650px;" controls>
        
      </video>
    </div>
    <p @click="requestVideoStream()" style="text-align: center; width: 100%; color: white; font-size: 28px; cursor: pointer; font-weight: bold; text-shadow: 0px 0px 2px black;" class="material-icons">
      videocam
    </p>   
    <span style="cursor: pointer; margin-top: 15px; float: left; font-size: 28px; color: white;" class="material-icons">
      attach_file
    </span>
    <input style="float: left; margin: 10px; display: inline; width: 90%; position: relative; top: 0px; left: 0px; right: 125px; bottom: 0px;" v-model="textarea" class="form-control textarea" name="message"/>
    <div style="float: left; display: flex; justify-content: center; align-items: center; width: 45px; height: 45px; border-radius: 100%; background-color: aqua; margin-top: 5px;">
      <label @click="sendMessage()" class="material-icons" for="sendButton" style="font-size: 28px; cursor: pointer; color: white;">
        send
      </label>
    </div>
  </div>  
</template>
<script>
// const socket = io({
//   path: "/myownpath"
// })
// const socket = io('/')
const socket = io()

var isSender = false
var peer = null

socket.on("connect", () => {
  console.log("connect")
})

socket.on("error", (error) => {
  console.log("error")
})

socket.on('sendMessage', (message, color) => {
  console.log(`sendMessage: ${message}`)
  let msg = document.createElement('div')
  let sideOfMsg = isSender ? 'left' : 'right'
  isSender = false
  msg.classList += `btn btn-${color}`
  msg.style = `
    text-align: ${sideOfMsg};
    float: ${sideOfMsg};
    font-size: 14px;
    font-weight: bold;
    clear: both;
    color: tan;
    min-width: 40%;
    min-height: 50px;
    margin: 5px;
  `
  msg.textContent = message
  document.body.appendChild(msg)
})


socket.on('receiveVideoStream', (peerStream) => {
  connectToPeer(peerStream)
})

function connectToPeer(id){
  peer.call(id, window.localStream)
}   

var colors = [
  "primary",
  "secondary",
  "success",
  "danger",
  "warning",
  "info",
  "light",
  "dark"
]
var randomcolor = Math.floor(Math.random() * colors.length)
var mycolor = colors[randomcolor]

export default {
  name: 'Home',
  data(){
    return {
      roomId: '',
      mystream: null,
      peerId: "#",
      peerIndex: 0,
      port: '4000',
      textarea: '',
      isSender: false,
      colors: [
        "primary",
        "secondary",
        "success",
        "danger",
        "warning",
        "info",
        "light",
        "dark"
      ],
      randomcolor: '',
      mycolor: ''
    }
  },
  components: {
    
  },
  mounted(){
      // fetch(`http://localhost:4000/room/${this.$route.params.room}/?phone=${this.$route.query.phone}`, {
      fetch(`https://phonesoft.herokuapp.com/room/${this.$route.params.room}/?phone=${this.$route.query.phone}`, {
        mode: 'cors',
        method: 'GET'
      }).then(response => response.body).then(rb  => {
        const reader = rb.getReader()
        return new ReadableStream({
          start(controller) {
            function push() {
              reader.read().then( ({done, value}) => {
                if (done) {
                  
                  controller.close();
                  return;
                }
                controller.enqueue(value);
                
                push();
              })
            }
            push();
          }
        });
    }).then(stream => {
        return new Response(stream, { headers: { "Content-Type": "text/html" } }).text();
      })
      .then(async result => {
        console.log(JSON.parse(result))
        this.randomcolor = Math.floor(Math.random() * this.colors.length)
        this.mycolor = this.colors[this.randomcolor]
        this.peerIndex = JSON.parse(result).peerindex
        this.port =  JSON.parse(result).port
        this.mystream = null
        this.peerId = JSON.parse(result).peer
        
        this.cursorOfConnection = this.$route.query.cursorofconnection
        this.roomId = this.$route.params.room

        peer = new Peer(undefined, {
          path: '/peerjs',
          host: 'phonesoft.herokuapp.com',
          secure: true,
          port: this.port
        })

        peer.on('open', (id) => {
          let devices = []
          let permissions = {
            audio: false,
            video: false
          }
          navigator.mediaDevices.enumerateDevices().then(listOfDevices => {
            devices = listOfDevices
            for(let device of devices){
              if(device.kind.includes('audioinput')){
                permissions.audio = true
                break
              }
            }
            for(let device of devices){
              if(device.kind.includes('videoinput')){
                permissions.video = true
                break
              }
            }
            navigator.mediaDevices.getUserMedia(permissions).then((stream) => {
              if(this.peerIndex === 2){
                this.mystream = peer.call(this.peerId, stream)
              }
              window.localStream = stream
            }).catch(e => {
              
            })
            
          }).catch(e => {
            
          })
        })

        peer.on('call', (call) => {
          call.answer()
          call.on('stream', (userVideoStream) => {
            document.querySelector('#myvideo').srcObject = userVideoStream
            document.querySelector('#myvideo').addEventListener('loadedmetadata', () => {
              document.querySelector('#myvideo').play()
            })
            
          })
        })
      
      socket.on('alertMessage', (message) => {
        console.log(`alertMessage: ${message}`)
        alert(message)
      })
    })
  },
  methods: {
    requestVideoStream(){
      // fetch(`http://localhost:4000/video/?phone=${this.$route.query.phone}`, {
      fetch(`https://phonesoft.herokuapp.com/video/?phone=${this.$route.query.phone}`, {
        mode: 'cors',
        method: 'GET'
      }).then(response => response.body).then(rb  => {
        const reader = rb.getReader()
        return new ReadableStream({
          start(controller) {
            function push() {
              reader.read().then( ({done, value}) => {
                if (done) {
                  console.log('done', done);
                  controller.close();
                  return;
                }
                controller.enqueue(value);
                console.log(done, value);
                push();
              })
            }
            push();
          }
        });
    }).then(stream => {
        return new Response(stream, { headers: { "Content-Type": "text/html" } }).text();
      })
      .then(async result => {
        console.log(JSON.parse(result))
        
      })
    },
    sendMessage(){
      isSender = true
      let mainMessage = this.textarea

      // fetch(`http://localhost:4000/send?message=${mainMessage}&msgcolor=${mycolor}&phone=${this.$route.query.phone}&room=${this.$route.params.room}&cursorofconnection=${this.$route.query.cursorofconnection}`, {
      fetch(`https://phonesoft.herokuapp.com/send?message=${mainMessage}&msgcolor=${mycolor}&phone=${this.$route.query.phone}&room=${this.$route.params.room}&cursorofconnection=${this.$route.query.cursorofconnection}`, {
        mode: 'cors',
        method: 'GET'
      }).then(response => response.body).then(rb  => {
        const reader = rb.getReader()
        return new ReadableStream({
          start(controller) {
            function push() {
              reader.read().then( ({done, value}) => {
                if (done) {
                  
                  controller.close();
                  return;
                }
                controller.enqueue(value);
                
                push();
              })
            }
            push();
          }
        });
    }).then(stream => {
        return new Response(stream, { headers: { "Content-Type": "text/html" } }).text();
      })
      .then(async result => {
        
        if(JSON.parse(result).status.includes("OK")){
          this.textarea = ""
        } else if(JSON.parse(result).status.includes("Error")){
          this.$router.push({ name: "sockets", query: { phone: this.phone } })
        }
      }).catch(e => {
        
      })
    }
  }
}
</script>