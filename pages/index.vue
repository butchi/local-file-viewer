<template lang="pug">
v-layout
  v-navigation-drawer(
    v-model="drawer",
    :mini-variant="miniVariant",
    :clipped="clipped",
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
    v-btn(icon, @click.stop="openParentDirectory")
      v-icon
        | mdi-arrow-up-bold
    v-btn(icon, @click.stop="toggleRecursive")
      v-icon(v-if="recursive")
        | mdi-folder-open
      v-icon(v-else)
        | mdi-folder
    v-toolbar-title(v-text="title")
    v-spacer
    v-btn(href="//localhost:8000/login")
      | spotify auth

  v-dialog(v-model="dialog")
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

  v-card(v-if="curFileArr instanceof Array", min-width="1280")
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
            v-img(v-if="file.thumbnail", :src="file.thumbnail")
            v-img(v-if="file.videoThumb", :src="file.videoThumb")
            v-img(v-if="file.artworkUrl", :src="file.artworkUrl")
            v-card-title.text-caption
              | {{ decodeURIComponent(file.name) }}
              v-card-text(v-if="isDirectory(file.path)")
                v-icon(x-large)
                  | mdi-folder

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

  v-footer(:absolute="!fixed", app)
    span
      | &copy; {{ new Date().getFullYear() }}
</template>

<script>
import path from "path";

import Logo from "~/components/Logo.vue";
import VuetifyLogo from "~/components/VuetifyLogo.vue";

const rootPath = "C://Users/iwabuchi-yuki-butchi/";
//- const rootPath = "/Users/iwabuchi-yuki-butchi/";

export default {
  data() {
    return {
      clipped: false,
      drawer: true,
      fixed: false,
      miniVariant: true,
      right: true,
      rightDrawer: false,
      dialog: false,
      title: "Local file viewer",
      curDirPath: rootPath,
      itemArr: [
        {
          id: rootPath,
          name: "~/",
          children: [],
        },
      ],
      dirMode: "grid",
      recursive: false,
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
      const objPath = pathArr[0];

      if (objPath == null) {
      } else if (this.isDirectory(objPath)) {
        this.openDirectory(objPath);
      } else {
        this.openFile(objPath);
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
      this.curFileArr.length = 0;

      this.curDirPath = dirPath;

      this.title = this.curDirPath;

      const curFileArr = await this.ls(dirPath, {
        recursive: this.recursive,
      });

      const promiseArr = [...curFileArr].map(async (file) => {
        return this.ffprobe(file.path).then((res) => {
          this.curFileArr.push(file);

          if (!res.json) {
            return;
          }

          res.json().then((metadata) => {
            if (metadata && metadata.format) {
              if (metadata.format.format_name.match(/image|png|jpeg/g)) {
                const idx = this.curFileArr.findIndex(
                  (f) => f.path === file.path
                );

                this.thumbnail(file.path).then((res) => {
                  res.blob().then((blob) => {
                    this.$set(
                      this.curFileArr[idx],
                      "thumbnail",
                      this.blobToMedia(blob)
                    );
                  });
                });
              }

              if (metadata.format.format_name.match(/mov|mp4/g)) {
                // ffmpegにファイル2GB制限があったので大きい動画はサムネ表示できない
                if (metadata.format.size < 2000000000) {
                  const idx = this.curFileArr.findIndex(
                    (f) => f.path === file.path
                  );

                  this.videoThumb(file.path).then((res) => {
                    res.blob().then((blob) => {
                      this.$set(
                        this.curFileArr[idx],
                        "videoThumb",
                        this.blobToMedia(blob)
                      );
                    });
                  });
                }
              }
            }

            if (metadata && metadata.format && metadata.format.tags) {
              const idx = this.curFileArr.findIndex(
                (f) => f.path === file.path
              );

              this.$set(this.curFileArr[idx], "metadata", metadata);

              let { artist, album, title } = metadata.format.tags;

              const parentPath0 = file.path;
              const parentPath1 = path.join(parentPath0, "../");
              const parentPath2 = path.join(parentPath1, "../");

              const parentName0 = path.basename(parentPath0);
              const parentName1 = path.basename(parentPath1);
              const parentName2 = path.basename(parentPath2);

              title = title || parentName0;
              album = album || parentName1;
              artist = artist || parentName2;

              const query = `${artist} ${album}`
                .replaceAll(/\([^\)]+\)/g, "")
                .replaceAll(/（[^）]+）/g, "")
                .replaceAll(/[，、．。,\.]/g, "")
                .replaceAll(/\- Single/g, "");

              this.artwork({ query }).then((res) => {
                res.json().then((artworkUrl) => {
                  this.$set(this.curFileArr[idx], "artworkUrl", artworkUrl);
                });
              });
            }
          });
        });
      });

      // ffprobeの処理が全部終わったらここで追加処理
      Promise.all(promiseArr).then(() => {});
    },
    async openParentDirectory() {
      this.curDirPath = path.join(this.curDirPath, "../");

      this.recursive = false;

      this.openDirectory(this.curDirPath);
    },
    async openFile(filePath) {
      this.dialog = true;

      this.fObj = {
        path: filePath,
      };

      this.fObj = await this.cat(filePath);
    },
    toggleRecursive() {
      this.recursive = !this.recursive;

      this.openDirectory(this.curDirPath);
    },
    async ls(dirPath, { recursive = false }) {
      let res;

      if (recursive) {
        res = await fetch(
          `//localhost:8000/api/ls?path=${encodeURIComponent(
            dirPath
          )}&recursive=true`
        );
      } else {
        res = await fetch(
          `//localhost:8000/api/ls?path=${encodeURIComponent(dirPath)}`
        );
      }

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
    async cat(filePath) {
      const res = await fetch(
        `//localhost:8000/api/cat?path=${encodeURIComponent(filePath)}`
      );

      const contentType = res.headers.get("Content-Type");

      let type = "file";

      if (contentType.match(/^application\//g)) {
        type = "application";

        const text = await res.text();

        return {
          path: filePath,
          type,
          contentType,
          content: text,
        };
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
        path: filePath,
        type,
        contentType,
        content: blob,
      };
    },
    async ffprobe(filePath) {
      if (this.isDirectory(filePath)) {
        return {};
      }

      const res = await fetch(
        `//localhost:8000/api/ffprobe?path=${encodeURIComponent(filePath)}`
      );

      return res;
    },
    async thumbnail(filePath) {
      const res = await fetch(
        `//localhost:8000/api/thumbnail?path=${encodeURIComponent(filePath)}`
      );

      return res;
    },
    async videoThumb(filePath) {
      const res = await fetch(
        `//localhost:8000/api/videothumb?path=${encodeURIComponent(filePath)}`
      );

      return res;
    },
    async artwork({ query }) {
      const res = await fetch(`//localhost:8000/api/artwork?q=${query}`);

      return res;
    },
    async fetchDirectory(obj) {
      const dirPath = obj.id;

      const json = await this.ls(dirPath, {
        recursive: this.recursive,
      });

      obj.children = this.itemArr.children = json.map((item) => {
        const name = decodeURIComponent(item.name);

        const ret = Object.assign(
          {},
          {
            id: dirPath + name,
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
      return n[n.length - 1] === "/";
    },
    extname(filePath) {
      return path.extname(filePath);
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
