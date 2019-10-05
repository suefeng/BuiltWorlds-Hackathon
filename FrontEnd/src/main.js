import Vue from 'vue'
import routes from './routes'
import App from './App.vue'

const app = new Vue({
  el: '#app',
  data: {
    currentRoute: window.location.pathname,
    clusters: [],
  },
  computed: {
    ViewComponent() {
      const matchingView = routes[this.currentRoute]
      return matchingView
        ? require('./pages/' + matchingView + '.vue')
        : require('./pages/404.vue')
    }
  },
  components: {
  },
  render: h => h(App)

});

window.addEventListener('popstate', () => {
  app.currentRoute = window.location.pathname;
});
