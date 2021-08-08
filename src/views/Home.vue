<template>
  <div>
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
// import socketio from 'socket.io'
// import { io } from 'socket.io'

// import { io } from "socket.io-client"
const io = require("socket.io-client")


export default {
  name: 'Home',
  data(){
    return {
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
  methods: {
    sendMessage(){
      this.isSender = true
      let mainMessage = this.textarea
      fetch(`http://localhost:4000/send/?message=${mainMessage}&msgcolor=${this.mycolor}&phone=${this.phone}&room=${this.roomId}&cursorOfConnection=${this.cursorOfConnection}`, {
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
        if(JSON.parse(result).status.includes("OK")){
          this.textarea = ""
        } else if(JSON.parse(result).status.includes("Error")){
          this.$router.push({ name: "sockets", query: { phone: this.phone } })
        }
      })
    },
    mounted(){
      fetch(`http://localhost:4000/room/${this.$route.params.room}/?phone=${this.$route.query.phone}&room=${this.roomId}`, {
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
        
        this.randomcolor = Math.floor(Math.random() * this.colors.length)
        this.mycolor = this.colors[this.randomcolor]
        
        // const socket = io("http://localhost:4000")
        // const socket = io.connect('localhost')
        // socket.on("connect", () => {
        //   console.log("connect")
        // })
        
        // socket.on("disconnect", (reason) => {
        //   console.log("disconnect")
        // })

        // socket.io.on("error", (error) => {
        //   console.log("error")
        // })

        const socket = io('/');
          socket.on('clientsocket', () => {
          console.log('clientsocket')
        })
        socket.on('connect', () => {
          console.log('connect')
          socket.emit('clientsocket')
        })
        socket.on('disconnect', () => {
          console.log('disconnect')
        })
        socket.on('joined', () => {
          console.log('joined')
        })
        socket.on('audience', () => {
          console.log('audience')
        })
        socket.on('end', () => {
          console.log('end')
        })
        socket.on('welcome', () => {
          console.log('welcome')
        })
        socket.on('start', () => {
          console.log('start')
        })
        socket.on('ask', () => {
          console.log('ask')
        })
        socket.on('results', () => {
          console.log('results')
        })

        // socketio.on('sendMessage', (message, color) => {
        //   console.log(`sendMessage: ${message}`)
        //   let msg = document.createElement('div')
        //   let sideOfMsg = this.isSender ? 'left' : 'right'
        //   this.isSender = false
        //   msg.classList += `btn btn-${color}`
        //   msg.style = `
        //     text-align: ${sideOfMsg};
        //     float: ${sideOfMsg};
        //     font-size: 14px;
        //     font-weight: bold;
        //     clear: both;
        //     color: tan;
        //     min-width: 40%;
        //     min-height: 50px;
        //     margin: 5px;
        //   `
        //   msg.textContent = message
        //   document.body.appendChild(msg)
        // })
      })
      
      socketio.on('alertMessage', (message) => {
        console.log(`alertMessage: ${message}`)
        alert(message)
      })
    }
  }
}
</script>