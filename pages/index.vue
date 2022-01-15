<template lang="pug">
v-layout
  v-navigation-drawer(
    v-model="drawer",
    :mini-variant="miniVariant",
    :clipped="clipped",
    fixed,
    app
  )
    v-list
      v-list-item(
        v-for="(item, i) in items",
        :key="i",
        :to="item.to",
        router,
        exact
      )
        v-list-item-action
          v-icon
            | {{ item.icon }}
        v-list-item-content
          v-list-item-title(v-text="item.title")
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

  v-flex(xs4)
    v-treeview(
      :active.sync="active",
      :items="itemArr",
      :load-children="fetchDirectory",
      :open.sync="open",
      activatable
    )
      template(v-slot:prepend="{ item }")
        v-icon(
          v-if="item.children",
          v-text="`mdi-${item.name === '~/' ? 'home-variant' : 'folder'}`"
        )

  v-flex(v-if="fObj.content", xs8)
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
      drawer: false,
      fixed: false,
      items: [
        {
          icon: "mdi-apps",
          title: "Welcome",
          to: "/",
        },
        {
          icon: "mdi-chart-bubble",
          title: "Inspire",
          to: "/inspire",
        },
      ],
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
      active: [],
      fObj: {},
    };
  },
  components: {
    Logo,
    VuetifyLogo,
  },
  computed: {},
  watch: {
    async active() {
      const path = this.active[0];

      if (path[path.length - 1] === "/") {
        const content = await this.ls(path);

        this.fObj = {
          type: "directory",
          content,
        };
      } else {
        this.fObj = await this.cat(path);
      }
    },
  },
  methods: {
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
