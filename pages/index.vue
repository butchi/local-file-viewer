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

  v-dialog(v-model="dialog", width="960")
    v-card(v-if="fObj.type === 'application'")
      v-card-title
        | {{ fObj.path }}
      v-card-text(v-html="stringToHtml(fObj.content)")
    v-card(v-else-if="fObj.type === 'image'")
      v-card-title
        | {{ fObj.path }}
      v-card-text
        v-img(:src="blobToMedia(fObj.content)", max-height="960", contain)
    v-card(v-else-if="fObj.type === 'video'")
      v-card-title
        | {{ fObj.path }}
      v-card-text
        video(:src="blobToMedia(fObj.content)", width="100%", controls)
    v-card(v-else-if="fObj.type === 'audio'")
      v-card-title
        | {{ fObj.path }}
      v-card-text
        audio(:src="blobToMedia(fObj.content)", controls)
    v-card(v-else-if="fObj.type === 'file'")
      v-card-title
        | {{ fObj.path }}
      v-card-text
        | {{ fObj.contentType }}
    v-card(v-else, loading="true")
      v-card-title
        | {{ fObj.path }}
      v-card-text
        | loading

  v-card(v-if="curFileArr && curFileArr.length > 0")
    v-btn.ma-1(
      color="primary",
      :text="dirMode == 'grid'",
      @click.stop="dirMode = 'grid'"
    )
      | グリッド
    v-btn.ma-1(
      color="primary",
      :text="dirMode == 'detail'",
      @click.stop="dirMode = 'detail'"
    )
      | 詳細

    v-card-text(v-if="dirMode == 'grid'")
      v-row
        v-col(v-for="(file, i) in curFileArr", :key="i", cols="2")
          v-card(
            min-height="160",
            min-width="160",
            @click.stop="fileClickHandler(file)"
          )
            v-card-title.text-caption
              | {{ decodeURIComponent(file.name) }}

    v-data-table(
      v-else,
      :headers="dirHeaderArr",
      :options="{ itemsPerPage: 15 }",
      :items="curFileArr",
      @click:row="fileClickHandler"
    )
      template(v-slot:item.name="{ item }")
        v-flex
          | {{ decodeURIComponent(item.name) }}
      template(v-slot:item.atimeMs="{ item }")
        v-flex.text-caption
          | {{ msToDate(item.atimeMs) }}
      template(v-slot:item.mtimeMs="{ item }")
        v-flex.text-caption
          | {{ msToDate(item.mtimeMs) }}
      template(v-slot:item.birthtimeMs="{ item }")
        v-flex.text-caption
          | {{ msToDate(item.birthtimeMs) }}
      template(v-slot:item.size="{ item }")
        v-flex(v-if="item.size === 0")
          | {{ '' }}
        v-flex(v-else-if="item.size < 1024 * 1024")
          | {{ Math.ceil(item.size / 1024) + 'KB' }}
        v-flex(v-else-if="item.size < 1024 * 1024 * 1024")
          | {{ Math.ceil(item.size / 1024 / 1024) + 'MB' }}
        v-flex(v-else-if="item.size < 1024 * 1024 * 1024 * 1024")
          | {{ Math.ceil(item.size / 1024 / 1024 / 1024) + 'GB' }}

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

const rootPath = "C:\\\\Users\\iwabuchi-yuki-butchi\\";
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
      dialog: false,
      title: "Local file viewer",
      itemArr: [
        {
          id: rootPath,
          name: "~/",
          children: [],
        },
      ],
      dirMode: "grid",
      open: [],
      curFileArr: [],
      fObj: {},
      dirHeaderArr: [
        {
          text: "ファイル名",
          value: "name",
        },
        {
          text: "最終アクセス日時",
          value: "atimeMs",
        },
        {
          text: "最終変更日時",
          value: "mtimeMs",
        },
        {
          text: "作成日時",
          value: "birthtimeMs",
        },
        {
          text: "サイズ",
          value: "size",
        },
      ],
    };
  },
  components: {
    Logo,
    VuetifyLogo,
  },
  mounted() {
    this.openDirectory(rootPath);
  },
  computed: {},
  methods: {
    activeHandler(pathArr) {
      const path = pathArr[0];

      if (path == null) {
      } else if (this.isDirectory(path)) {
        this.openDirectory(path);
      } else {
        this.openFile(path);
      }
    },
    fileClickHandler(file) {
      if (this.isDirectory(file.path)) {
        this.openDirectory(file.path);
      } else {
        this.openFile(file.path);
      }
    },
    async openDirectory(dirPath) {
      this.curFileArr = await this.ls(dirPath);
    },
    async openFile(path) {
      this.dialog = true;

      this.fObj = {
        path,
      };

      this.fObj = await this.cat(path);
    },
    async ls(dirPath) {
      const res = await fetch(
        `//localhost:8000/api/ls?path=${encodeURIComponent(dirPath)}`
      );

      const json = await res.json();

      const fileArr = json;

      if (fileArr == null) {
        return [];
      } else if (fileArr.length === 0) {
        return [];
      } else {
        return fileArr.filter((item = { name: "" }) => item.name[0] !== ".");
      }
    },
    async cat(path) {
      const res = await fetch(
        `//localhost:8000/api/cat?path=${encodeURIComponent(path)}`
      );

      const contentType = res.headers.get("Content-Type");

      let type = "file";

      if (contentType.match(/^application\//g)) {
        type = "application";

        const text = await res.text();

        return {
          path,
          type,
          contentType,
          content: text,
        };
      }

      if (contentType.match(/^image\//g)) {
        type = "image";
      }

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
        path,
        type,
        contentType,
        content: blob,
      };
    },
    async fetchDirectory(obj) {
      const path = obj.id;

      const json = await this.ls(path);

      obj.children = this.itemArr.children = json.map((item) => {
        const name = decodeURIComponent(item.name);

        const ret = Object.assign(
          {},
          {
            id: path + name,
            name,
          },
          this.isDirectory(name) ? { children: [] } : {}
        );

        return ret;
      });

      return json;
    },
    isDirectory(name) {
      const n = decodeURIComponent(name);
      return n[n.length - 1] === "/" || n[n.length - 1] === "\\";
    },
    blobToMedia(blob) {
      return URL.createObjectURL(blob);
    },
    stringToHtml(str) {
      return str.replaceAll(" ", "&nbsp;").replaceAll("\n", "<br />");
    },
    msToDate(ms) {
      const date = new Date(ms);

      return date.toLocaleString("ja-JP");
    },
  },
};
</script>
