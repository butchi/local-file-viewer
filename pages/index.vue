<template lang="pug">
v-layout
  v-navigation-drawer(
    v-model="drawer",
    :mini-variant="miniVariant",
    :mini-variant-width="150",
    :clipped="clipped",
    width="690",
    expand-on-hover,
    fixed,
    app
  )
    v-treeview(
      :items="itemArr",
      :load-children="fetchDirectory",
      :open.sync="open",
      @update:active="activeHandler",
      activatable
    )
      template(v-slot:prepend="{ item }")
        v-flex(v-if="item.children")
          v-icon(v-if="item.name === '~/'")
            | mdi-home-variant
          v-icon(v-else)
            | mdi-folder
        v-flex(v-else)
          v-icon
            | mdi-file

  v-app-bar(:clipped-left="clipped", fixed, app)
    v-app-bar-nav-icon(@click.stop="drawer = !drawer")
    v-btn(icon, @click.stop="miniVariant = !miniVariant")
      v-icon
        | mdi-{{ `chevron-${miniVariant ? 'right' : 'left'}` }}
    v-btn(icon, @click.stop="clipped = !clipped")
      v-icon
        | mdi-application
    v-btn(icon, @click.stop="fixed = !fixed")
      v-icon
        | mdi-minus
    v-toolbar-title(v-text="title")
    v-spacer
    v-btn(icon, @click.stop="rightDrawer = !rightDrawer")
      v-icon
        | mdi-menu

  v-flex(v-if="fObj.content")
    v-card(v-if="fObj.type === 'image'")
      v-card-title
        | {{ active[0] }}
      v-card-text
        v-img(:src="blobToMedia(fObj.content)")
    v-card(v-if="fObj.type === 'video'")
      v-card-title
        | {{ active[0] }}
      v-card-text
        video(:src="blobToMedia(fObj.content)", width="100%", controls)
    v-card(v-if="fObj.type === 'audio'")
      v-card-title
        | {{ active[0] }}
      v-card-text
        audio(:src="blobToMedia(fObj.content)", controls)
    v-card(v-if="fObj.type === 'file'")
      v-card-title
        | {{ active[0] }}
      v-card-text
        | {{ fObj.contentType }}
    v-card(v-else)
      v-card-text
        v-row
          v-col(v-for="(val, i) in fObj.content", :key="i", cols="6")
            v-card
              v-card-title
                | {{ val }}

  v-navigation-drawer(v-model="rightDrawer", :right="right", temporary, fixed)
    v-list
      v-list-item(@click.native="right = !right")
        v-list-item-action
          v-icon(light)
            | mdi-repeat
        v-list-item-title
          | Switch drawer (click me)
  v-footer(:absolute="!fixed", app)
    span
      | &copy; {{ new Date().getFullYear() }}
</template>

<script>
import Logo from "~/components/Logo.vue";
import VuetifyLogo from "~/components/VuetifyLogo.vue";

const rootPath = "C://Users/iwabuchi-yuki-butchi/";
// const rootPath = "/Users/iwabuchi-yuki-butchi/";

export default {
  data() {
    return {
      clipped: false,
      drawer: true,
      fixed: false,
      miniVariant: false,
      right: true,
      rightDrawer: false,
      title: "Local file viewer",
      itemArr: [
        {
          id: rootPath,
          name: "~/",
          children: [],
        },
      ],
      open: [],
      fObj: {},
    };
  },
  components: {
    Logo,
    VuetifyLogo,
  },
  computed: {},
  methods: {
    activeHandler(pathArr) {
      const path = pathArr[0];

      if (path == null) {
      } else if (path[path.length - 1] === "/") {
        this.openDirectory(path);
      } else {
        this.openFile(path);
      }
    },
    async openDirectory(path) {
      const content = await this.ls(path);

      this.fObj = {
        type: "directory",
        content,
      };
    },
    async openFile(path) {
      this.fObj = await this.cat(path);
    },
    async ls(path) {
      const res = await fetch(
        `//localhost:8000/api/ls?path=${encodeURIComponent(path)}`
      );

      const json = await res.json();

      return json.filter((item) => item[0] !== ".");
    },
    async cat(path) {
      const res = await fetch(
        `//localhost:8000/api/cat?path=${encodeURIComponent(path)}`
      );

      const contentType = res.headers.get("Content-Type");

      let type = "file";

      if (contentType.match(/^image\//g)) {
        type = "image";
      }

      if (contentType.match(/^video\//g)) {
        type = "video";
      }

      if (contentType.match(/^audio\//g)) {
        type = "audio";
      }

      const blob = await res.blob();

      return {
        type,
        contentType,
        content: blob,
      };
    },
    async fetchDirectory(item) {
      const path = item.id;

      const json = await this.ls(path);

      item.children = this.itemArr.children = json.map((val, _i) => {
        const v = decodeURIComponent(val);

        return Object.assign(
          {},
          {
            id: path + v,
            name: v,
          },
          v[v.length - 1] === "/" ? { children: [] } : {}
        );
      });

      return json;
    },
    blobToMedia(blob) {
      return URL.createObjectURL(blob);
    },
  },
};
</script>
