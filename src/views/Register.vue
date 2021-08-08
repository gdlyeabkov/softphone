<template>
  <div>
    <input placeholder="+79254683410" style="float: left; margin: 10px; display: inline; width: 90%; position: relative; top: 0px; left: 0px; right: 125px; bottom: 0px;" v-model="phone" class="form-control phone" name="phone" type="phone">
    <button style="margin-top: 10px;" @click="createSocket()" class="btn btn-primary">Зайти</button>
  </div>  
</template>
<script>
export default {
  name: 'Home',
  data(){
    return {
      phone: ''
    }
  },
  components: {
    
  },
  methods: {
    createSocket(){
      let phone = this.phone
      fetch(`http://localhost:3030/create/?phonenumber=${phone}&socketid=#`, {
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
        window.location = `/sockets/?phone=${phone}`
      })
    }
  }
}
</script>