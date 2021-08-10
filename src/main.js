import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
// import VueSocketio from 'vue-socket.io'

Vue.config.productionTip = false

// Vue.use(new VueSocketio({
//   debug: true,
//     connection: 'http://localhost:4000',
//     vuex: {
//       store,
//       actionPrefix: 'SOCKET_',
//       mutationPrefix: 'SOCKET_'
//     },
//     options: {  } //Optional options
// }))

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')