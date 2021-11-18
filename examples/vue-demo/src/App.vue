<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import HelloWorld from './components/HelloWorld.vue'

const client = UBoxAuto({
    publicKey: 'nPhYXP9Wqx7+Om5SqOiPSqbFr94Ru34KCVqMc0KusZFcMTVYXWgxIUw2xX0=',
    privateKey: 'MBi+GEbwJqGlGjQXKjGgAs4fdak7ZsxxBeArvpaurIo8IsD0X8oFAcIRpAFG+Aqi'
});

(async () => {
    console.log(await client.getSdnboxCameraList({ projectId: 'org-dzfntz' }));
})();
</script>

<template>
    <div>
        <img alt="Vue logo" src="./assets/logo.png" />
        <HelloWorld msg="Hello Vue 3 + Vite" />
    </div>
</template>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
