<script>
  import Request from './Request.svelte';

  export let root = false;
  export let topLevel = false;
  export let expanded = false;
  export let name;
  export let _id = null;
  export let children;
  export let requests;

  function toggle() {
    expanded = !expanded;
  }

  $: showChildren = root || topLevel || expanded;
</script>

{#if !root}
  {#if topLevel}
    <a class="sidebar-list-link name top-level" href={_id ? `#${_id}` : '#'}>
      <span>{name}</span>
    </a>
  {:else}
    <span class="sidebar-list-link name" class:expanded on:click={toggle}>
      <span>{name}</span>
    </span>
  {/if}
{/if}

{#if showChildren}
  <ul>
    {#each children as child}
      <li class="folder"><svelte:self {...child} topLevel={root} /></li>
    {/each}
    {#each requests as request}
      <li class="request"><Request {request} /></li>
    {/each}
  </ul>
{/if}

<style>
  .sidebar-list-link {
    cursor: pointer;
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .sidebar-list-link::before {
    font-family: FontAwesome;
    content: '\f07b';
  }

  .sidebar-list-link.expanded::before {
    content: '\f07c';
  }

  .sidebar-list-link.top-level::before {
    content: '\f07c';
  }

  ul {
    list-style-type: none;
    padding-inline-start: 15px;
    font-size: 12px;
  }
</style>
