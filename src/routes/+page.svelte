<script lang="ts">
  let value = "text"
</script>

<main>
  <h1><textarea {value} data-gramm="false"
    data-gramm_editor="false"
    data-enable-grammarly="false"/></h1>
</main>

<style>

  @keyframes move {
    0% { transform: rotateY(0deg) }
    50% { transform: rotateY(180deg) }
    100% { transform: rotateY(360deg) }
  }

  h1 {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  textarea {
    padding: 0;
    margin: 0;
    text-align: center;
    font-size: 5rem;
    border: none;
    background-color: black;
    outline: none;
    color: white;
    animation: move 5s linear infinite;
    resize: none;
  }
</style>