<template>
  <div class="app" style="display: block; position: fixed; top: 0px;  left: 0px; height: 100%; width: 35%; background-color: rgb(242, 242, 242);">
    <div  style="float: left; margin: 5px; display: flex; justify-content: center; align-items: center; width: 65px; height: 65px; background-color: red; border-radius: 100%;">
      +
    </div>
    <p style=" float: left;">{{ phone }}</p>
    <br style="clear: both;"/>
    <hr />
    <div v-if="sockets.length !== 0">
      <div v-for="socket in sockets" :key="socket._id">
        <button @click="goToRoom(socket.phone, phone)" class="btn btn-primary" style="margin: 15px; clear: both; margin-top: 10px; min-width: 350px; min-height: 100px;">{{ socket.phone }}</button>
      </div>
    </div>
    <div v-else-if="sockets.length === 0">
      <p style="text-align: center; color: tan; font-weight: bold;">Сокетов нет</p>
    </div>
  </div>
</template>
<script>
import * as jwt from 'jsonwebtoken'
import io from 'socket.io-client'
// const io = require("socket.io-client")
export default {
  name: 'Home',
  data(){
    return {
      token: '#',
      sockets: [],
      phone: '',
      cursorOfConnection: 0
    }
  },
  components: {
    
  },
  created(){
    // const socket = io('/')
    // this.socket.on('clientsocket', () => {
    //   console.log('clientsocket')
    // })
  },
  methods: {
    goToRoom(socketPhone, phone){
      this.$router.push({ name: "Home", params: { room: socketPhone }, query: { phone: phone, cursorofconnection: this.cursorOfConnection } })
    }
  },
  mounted(){
    this.token = window.localStorage.getItem('phonesofttoken')

    // const socket = io()
    // socket.on('clientsocket', () => {
    //   console.log('clientsocket')
    // })
    // socket.on('connect', () => {
    //   console.log('connect')
    //   socket.emit('clientsocket')
    // })

    // let phone = '+79254683410'
    // if(this.$route.query.phone === undefined || this.$route.query.phone === null){
    //   phone = '+79254683410'
    // } else if(this.$route.query.phone !== undefined && this.$route.query.phone !== null){
    //   phone = this.$route.query.phone
    // }

    if(this.$route.query.redirectroute !== null && this.$route.query.redirectroute !== undefined){
      // логика перенаправления
      if(this.$route.query.redirectroute.includes('register') || this.$route.query.redirectroute.includes('socket')){
        this.$router.push({ path: this.$route.query.redirectroute })
      } else {     
        this.$router.push({ name: "Sockets" })
        // jwt.verify(this.token, 'phonesoftsecret', (err, decoded) => {
        //   if (err) {
        //     this.$router.push({ name: "Register" })
        //   } else {
        //     // fetch(`http://localhost:4000/sockets/?phone=${decoded.phonenumber}`, {
        //     fetch(`https://phonesoft.herokuapp.com/sockets/?phone=${decoded.phonenumber}`, {
        //         mode: 'cors',
        //         method: 'GET'
        //       }).then(response => response.body).then(rb  => {
        //         const reader = rb.getReader()
        //         return new ReadableStream({
        //           start(controller) {
        //             function push() {
        //               reader.read().then( ({done, value}) => {
        //                 if (done) {
        //                   console.log('done', done);
        //                   controller.close();
        //                   return;
        //                 }
        //                 controller.enqueue(value);
        //                 console.log(done, value);
        //                 push();
        //               })
        //             }
        //             push();
        //           }
        //         });
        //     }).then(stream => {
        //       return new Response(stream, { headers: { "Content-Type": "text/html" } }).text();
        //     })
        //     .then(async result => {
        //       console.log(JSON.parse(result))
        //       this.sockets = JSON.parse(result).sockets
        //       this.phone = JSON.parse(result).phone
        //       this.cursorOfConnection = JSON.parse(result).cursorOfConnection
        //     })
        //   }
        // })
      }
    } else if(this.$route.query.redirectroute === null || this.$route.query.redirectroute === undefined){
      jwt.verify(this.token, 'phonesoftsecret', (err, decoded) => {
        if (err) {
          this.$router.push({ name: "Register" })
        } else { 
          // fetch(`http://localhost:4000/sockets/?phone=${decoded.phonenumber}`, {
          fetch(`https://phonesoft.herokuapp.com/sockets/?phone=${decoded.phonenumber}`, {
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
            this.sockets = JSON.parse(result).sockets
            this.phone = JSON.parse(result).phone
            this.cursorOfConnection = JSON.parse(result).cursorOfConnection
          })
        }
      })
    }
  }
}
</script>
